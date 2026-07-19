'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft, Loader2, Edit, Trash2, Star, Package, Tag, Layers, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProductViewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAdminProducts({ limit: '200' });
        const p = res.data?.find((item: any) => item.id === id);
        if (p) {
          setProduct(p);
        } else {
          toast.error('Product not found');
          router.push('/admin/products');
        }
      } catch {
        toast.error('Failed to load product');
        router.push('/admin/products');
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api.deleteProduct(id);
      toast.success('Product deactivated');
      router.push('/admin/products');
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return (
    <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
  );

  if (!product) return null;

  const totalStock = product.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0;
  const images = product.images || [];
  const variants = product.variants || [];

  return (
    <div className="max-w-6xl">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Products
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">SKU: {product.sku} · Created {formatDate(product.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/products/${id}/edit`}
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-4 py-2 text-sm font-medium hover:bg-[#16213e] transition-all"
          >
            <Edit size={14} /> Edit
          </Link>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 transition-all">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images + Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package size={18} /> Images ({images.length})
            </h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {images.map((img: any, i: number) => (
                  <div key={img.id || i} className="relative aspect-[3/4] border overflow-hidden bg-gray-50">
                    <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-[#C9A84C] text-white text-[10px] px-1.5 py-0.5 font-medium">Primary</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No images</p>
            )}
          </div>

          {/* Description */}
          <div className="bg-white border p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description || 'No description'}</p>
            {(product.fabric || product.material || product.washCare) && (
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                {product.fabric && <div><p className="text-xs text-gray-400 uppercase">Fabric</p><p className="text-sm">{product.fabric}</p></div>}
                {product.material && <div><p className="text-xs text-gray-400 uppercase">Material</p><p className="text-sm">{product.material}</p></div>}
                {product.washCare && <div><p className="text-xs text-gray-400 uppercase">Wash Care</p><p className="text-sm">{product.washCare}</p></div>}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="bg-white border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers size={18} /> Variants ({variants.length})
            </h2>
            {variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Size</th>
                      <th className="text-left p-3 font-medium">Color</th>
                      <th className="text-left p-3 font-medium">SKU</th>
                      <th className="text-left p-3 font-medium">Price</th>
                      <th className="text-left p-3 font-medium">Stock</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v: any) => (
                      <tr key={v.id} className="border-t">
                        <td className="p-3">{v.size || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {v.colorHex && <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.colorHex }} />}
                            {v.color || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-xs text-gray-500 font-mono">{v.sku}</td>
                        <td className="p-3">{v.price ? formatPrice(v.price) : '-'}</td>
                        <td className="p-3">
                          <span className={v.stock > 10 ? 'text-green-600 font-medium' : v.stock > 0 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                            {v.stock}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs ${v.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {v.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No variants</p>
            )}
          </div>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white border p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active</span>
                {product.isActive ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-red-500" />}
              </div>
              {[
                ['isFeatured', 'Featured', 'bg-yellow-50 text-yellow-700'],
                ['isNewArrival', 'New Arrival', 'bg-blue-50 text-blue-700'],
                ['isBestSeller', 'Best Seller', 'bg-purple-50 text-purple-700'],
                ['isTrending', 'Trending', 'bg-orange-50 text-orange-700'],
              ].map(([key, label, cls]) => (
                product[key] && (
                  <span key={key} className={`inline-block px-2 py-1 text-xs ${cls}`}>{label}</span>
                )
              ))}
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white border p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Pricing</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Base Price</span>
                <span className="text-sm font-medium">{formatPrice(product.basePrice)}</span>
              </div>
              {product.salePrice && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Sale Price</span>
                    <span className="text-sm font-medium text-green-600">{formatPrice(product.salePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Discount</span>
                    <span className="text-sm font-medium text-red-500">{product.discountPercent}% off</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-gray-500">GST</span>
                <span className="text-sm">{product.gstRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">HSN</span>
                <span className="text-sm">{product.hsnCode || '-'}</span>
              </div>
            </div>
          </div>

          {/* Stock Card */}
          <div className="bg-white border p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Inventory</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Stock</span>
                <span className={`text-sm font-bold ${totalStock > 10 ? 'text-green-600' : totalStock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {totalStock}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Variants</span>
                <span className="text-sm">{variants.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Low Stock Alert</span>
                <span className="text-sm">{product.lowStockThreshold || 10}</span>
              </div>
            </div>
          </div>

          {/* Category Card */}
          <div className="bg-white border p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Organization</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm">{product.category?.name || '-'}</span>
              </div>
              {product.brand && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Brand</span>
                  <span className="text-sm">{product.brand.name}</span>
                </div>
              )}
              {product.gender && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Gender</span>
                  <span className="text-sm">{product.gender}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Wishlist</span>
                <span className="text-sm">{product._count?.wishlistItems || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reviews</span>
                <span className="text-sm">{product._count?.reviews || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Slug</span>
                <span className="text-xs text-gray-400 font-mono truncate max-w-[140px]">{product.slug}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
