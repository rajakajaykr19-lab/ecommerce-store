'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Search,
  Eye,
  Plus,
  Truck,
  MapPin,
  Package,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const SHIPMENT_STATUSES = [
  'ALL',
  'LABEL_CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const

type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

const STATUS_LABELS: Record<string, string> = {
  ALL: 'All',
  LABEL_CREATED: 'Label Created',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
}

interface Shipment {
  id: string
  orderId: string
  orderNumber: string
  courierPartnerId: string
  courierPartnerName: string
  trackingNumber: string
  trackingUrl: string
  status: string
  weight: number
  estimatedDeliveryDate: string
  currentLocation: string
  shippingLabelUrl: string
  createdAt: string
  updatedAt: string
  order?: {
    id: string
    orderNumber: string
    customer: {
      id: string
      name: string
      email: string
      phone: string
    }
    shippingAddress: {
      line1: string
      line2?: string
      city: string
      state: string
      postalCode: string
      country: string
    }
    total: number
    items: Array<{
      id: string
      name: string
      quantity: number
      price: number
    }>
  }
  statusHistory: Array<{
    status: string
    location: string
    timestamp: string
    notes: string
  }>
}

interface CourierPartner {
  id: string
  name: string
}

interface OrderSearchResult {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  total: number
}

interface ShipmentsResponse {
  shipments: Shipment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [courierPartners, setCourierPartners] = useState<CourierPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    labelCreated: 0,
    inTransit: 0,
    delivered: 0,
    todayShipments: 0,
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus>('ALL')
  const [courierFilter, setCourierFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 15

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  const [createForm, setCreateForm] = useState({
    orderSearch: '',
    orderId: '',
    orderNumber: '',
    courierPartnerId: '',
    trackingNumber: '',
    trackingUrl: '',
    weight: '',
    estimatedDeliveryDate: '',
  })
  const [orderSearchResults, setOrderSearchResults] = useState<OrderSearchResult[]>([])
  const [orderSearchLoading, setOrderSearchLoading] = useState(false)

  const [updateStatusForm, setUpdateStatusForm] = useState({
    status: '',
    location: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const allData = await api.getAdminShipments({ pageSize: '1' })
      const total = allData.total || 0

      const labelData = await api.getAdminShipments({ status: 'LABEL_CREATED', pageSize: '1' })
      const inTransitData = await api.getAdminShipments({ status: 'IN_TRANSIT', pageSize: '1' })
      const deliveredData = await api.getAdminShipments({ status: 'DELIVERED', pageSize: '1' })

      const today = new Date().toISOString().split('T')[0]
      const todayData = await api.getAdminShipments({ startDate: today, endDate: today, pageSize: '1' })

      setStats({
        total,
        labelCreated: labelData.total || 0,
        inTransit: inTransitData.total || 0,
        delivered: deliveredData.total || 0,
        todayShipments: todayData.total || 0,
      })
    } catch {
      // stats will stay at 0
    }
  }, [])

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) }
      if (search) params.search = search
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (courierFilter) params.courierPartnerId = courierFilter

      const data: ShipmentsResponse = await api.getAdminShipments(params)
      setShipments(data.shipments || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('Failed to load shipments')
      setShipments([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, courierFilter])

  useEffect(() => {
    api.getCourierPartners().then(setCourierPartners).catch(() => {})
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, courierFilter])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setCourierFilter('')
    setPage(1)
  }

  const handleOrderSearch = async (value: string) => {
    setCreateForm((prev) => ({ ...prev, orderSearch: value, orderId: '', orderNumber: '' }))
    if (value.length < 2) {
      setOrderSearchResults([])
      return
    }
    setOrderSearchLoading(true)
    try {
      const results = await api.getAdminOrders({ search: value })
      setOrderSearchResults(results || [])
    } catch {
      setOrderSearchResults([])
    } finally {
      setOrderSearchLoading(false)
    }
  }

  const selectOrder = (order: OrderSearchResult) => {
    setCreateForm((prev) => ({
      ...prev,
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderSearch: `${order.orderNumber} - ${order.customer.name}`,
    }))
    setOrderSearchResults([])
  }

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.orderId || !createForm.courierPartnerId || !createForm.trackingNumber) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      await api.createShipment({
        orderId: createForm.orderId,
        courierPartnerId: createForm.courierPartnerId,
        trackingNumber: createForm.trackingNumber,
        trackingUrl: createForm.trackingUrl || undefined,
        weight: createForm.weight ? parseFloat(createForm.weight) : undefined,
        estimatedDeliveryDate: createForm.estimatedDeliveryDate || undefined,
      })
      toast.success('Shipment created successfully')
      setShowCreateModal(false)
      setCreateForm({
        orderSearch: '',
        orderId: '',
        orderNumber: '',
        courierPartnerId: '',
        trackingNumber: '',
        trackingUrl: '',
        weight: '',
        estimatedDeliveryDate: '',
      })
      setOrderSearchResults([])
      fetchShipments()
      fetchStats()
    } catch {
      toast.error('Failed to create shipment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipment || !updateStatusForm.status) return
    setSubmitting(true)
    try {
      await api.updateShipment(selectedShipment.id, {
        status: updateStatusForm.status,
        location: updateStatusForm.location || undefined,
        notes: updateStatusForm.notes || undefined,
      })
      toast.success('Shipment status updated')
      setShowUpdateStatusModal(false)
      setSelectedShipment(null)
      setUpdateStatusForm({ status: '', location: '', notes: '' })
      fetchShipments()
      fetchStats()
    } catch {
      toast.error('Failed to update shipment status')
    } finally {
      setSubmitting(false)
    }
  }

  const openDetailModal = async (shipment: Shipment) => {
    if (!shipment.order) {
      try {
        const full = await api.getShipmentById(shipment.id)
        setSelectedShipment(full)
      } catch {
        setSelectedShipment(shipment)
      }
    } else {
      setSelectedShipment(shipment)
    }
    setShowDetailModal(true)
  }

  const openUpdateStatus = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setUpdateStatusForm({
      status: shipment.status,
      location: shipment.currentLocation || '',
      notes: '',
    })
    setShowUpdateStatusModal(true)
  }

  const downloadShippingLabel = async (shipment: Shipment) => {
    if (!shipment.shippingLabelUrl) {
      toast.error('No shipping label available')
      return
    }
    window.open(shipment.shippingLabelUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all shipments
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Shipment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Shipments</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Truck className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Label Created</p>
              <p className="text-xl font-bold">{stats.labelCreated}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-xl font-bold">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-xl font-bold">{stats.delivered}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Shipments</p>
              <p className="text-xl font-bold">{stats.todayShipments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tracking number, order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Couriers</option>
            {courierPartners.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name}
              </option>
            ))}
          </select>
          {(search || statusFilter !== 'ALL' || courierFilter) && (
            <Button variant="outline" onClick={clearFilters} className="text-sm">
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Courier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tracking #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Est. Delivery</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Current Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading shipments...</p>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package className="h-10 w-10 mx-auto text-gray-300" />
                    <p className="text-gray-500 mt-2">No shipments found</p>
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-gray-900">{shipment.courierPartnerName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {shipment.trackingNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${shipment.orderId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {shipment.orderNumber || '#—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          shipment.status
                        )}`}
                      >
                        {STATUS_LABELS[shipment.status] || shipment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {shipment.estimatedDeliveryDate
                        ? formatDate(shipment.estimatedDeliveryDate)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {shipment.currentLocation ? (
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {shipment.currentLocation}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(shipment.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetailModal(shipment)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openUpdateStatus(shipment)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          title="Update Status"
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadShippingLabel(shipment)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          title="Download Label"
                        >
                          <Package className="h-4 w-4" />
                        </button>
                        {shipment.trackingUrl && (
                          <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            title="Track Shipment"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Create Shipment</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({
                    orderSearch: '',
                    orderId: '',
                    orderNumber: '',
                    courierPartnerId: '',
                    trackingNumber: '',
                    trackingUrl: '',
                    weight: '',
                    estimatedDeliveryDate: '',
                  })
                  setOrderSearchResults([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateShipment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.orderSearch}
                  onChange={(e) => handleOrderSearch(e.target.value)}
                  placeholder="Search by order number..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!createForm.orderId}
                />
                {orderSearchLoading && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                  </div>
                )}
                {orderSearchResults.length > 0 && (
                  <div className="mt-1 border rounded-lg bg-white shadow max-h-40 overflow-y-auto">
                    {orderSearchResults.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => selectOrder(order)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-0"
                      >
                        <span className="font-medium">{order.orderNumber}</span>
                        <span className="text-gray-500 ml-2">{order.customer.name}</span>
                        <span className="text-gray-400 ml-2">{formatPrice(order.total)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {createForm.orderId && (
                  <p className="mt-1 text-sm text-green-600">
                    Selected: {createForm.orderNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier Partner <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.courierPartnerId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, courierPartnerId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select courier partner</option>
                  {courierPartners.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.trackingNumber}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, trackingNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking URL
                </label>
                <input
                  type="url"
                  value={createForm.trackingUrl}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, trackingUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.weight}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, weight: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Delivery Date
                  </label>
                  <input
                    type="date"
                    value={createForm.estimatedDeliveryDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        estimatedDeliveryDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm({
                      orderSearch: '',
                      orderId: '',
                      orderNumber: '',
                      courierPartnerId: '',
                      trackingNumber: '',
                      trackingUrl: '',
                      weight: '',
                      estimatedDeliveryDate: '',
                    })
                    setOrderSearchResults([])
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...
                    </>
                  ) : (
                    'Create Shipment'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Shipment Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedShipment(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-mono font-medium">{selectedShipment.trackingNumber}</p>
                </div>
                {selectedShipment.trackingUrl && (
                  <a
                    href={selectedShipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Track <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Courier Partner</p>
                  <p className="font-medium">{selectedShipment.courierPartnerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedShipment.status
                    )}`}
                  >
                    {STATUS_LABELS[selectedShipment.status] || selectedShipment.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium">
                    {selectedShipment.weight ? `${selectedShipment.weight} kg` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Est. Delivery</p>
                  <p className="font-medium">
                    {selectedShipment.estimatedDeliveryDate
                      ? formatDate(selectedShipment.estimatedDeliveryDate)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Location</p>
                  <p className="font-medium">
                    {selectedShipment.currentLocation || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(selectedShipment.createdAt)}</p>
                </div>
              </div>

              {selectedShipment.order && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Order Number</span>
                      <Link
                        href={`/admin/orders/${selectedShipment.order.id}`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        {selectedShipment.order.orderNumber}
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Customer</span>
                      <span className="text-sm font-medium">
                        {selectedShipment.order.customer.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Email</span>
                      <span className="text-sm">{selectedShipment.order.customer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Phone</span>
                      <span className="text-sm">{selectedShipment.order.customer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-sm font-medium">
                        {formatPrice(selectedShipment.order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedShipment.order?.shippingAddress && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Shipping Address
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                    <p>{selectedShipment.order.shippingAddress.line1}</p>
                    {selectedShipment.order.shippingAddress.line2 && (
                      <p>{selectedShipment.order.shippingAddress.line2}</p>
                    )}
                    <p>
                      {selectedShipment.order.shippingAddress.city},{' '}
                      {selectedShipment.order.shippingAddress.state}{' '}
                      {selectedShipment.order.shippingAddress.postalCode}
                    </p>
                    <p>{selectedShipment.order.shippingAddress.country}</p>
                  </div>
                </div>
              )}

              {selectedShipment.statusHistory &&
                selectedShipment.statusHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Status History</h3>
                    <div className="space-y-3">
                      {selectedShipment.statusHistory.map((entry, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                idx === 0 ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            />
                            {idx < (selectedShipment.statusHistory?.length ?? 0) - 1 && (
                              <div className="w-px flex-1 bg-gray-200 mt-1" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium text-gray-900">
                              {STATUS_LABELS[entry.status] || entry.status}
                            </p>
                            {entry.location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {entry.location}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-gray-500">{entry.notes}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDate(entry.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex gap-3 border-t pt-4">
                {selectedShipment.shippingLabelUrl && (
                  <Button
                    variant="outline"
                    onClick={() => downloadShippingLabel(selectedShipment)}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" /> Download Label
                  </Button>
                )}
                {selectedShipment.trackingUrl && (
                  <a
                    href={selectedShipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" /> Track Online
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdateStatusModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Update Shipment Status</h2>
              <button
                onClick={() => {
                  setShowUpdateStatusModal(false)
                  setSelectedShipment(null)
                  setUpdateStatusForm({ status: '', location: '', notes: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Tracking:{' '}
                  <span className="font-mono font-medium">
                    {selectedShipment.trackingNumber}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={updateStatusForm.status}
                  onChange={(e) =>
                    setUpdateStatusForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select status</option>
                  <option value="LABEL_CREATED">Label Created</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Location
                </label>
                <input
                  type="text"
                  value={updateStatusForm.location}
                  onChange={(e) =>
                    setUpdateStatusForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g. Mumbai Distribution Center"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={updateStatusForm.notes}
                  onChange={(e) =>
                    setUpdateStatusForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowUpdateStatusModal(false)
                    setSelectedShipment(null)
                    setUpdateStatusForm({ status: '', location: '', notes: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
