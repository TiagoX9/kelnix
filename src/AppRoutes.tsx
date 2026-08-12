import { Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import App from './App.tsx'
import ConsentBanner from './components/ConsentBanner.tsx'
import NibsPrivacy from './components/NibsPrivacy.tsx'
import Products from './components/Products.tsx'
import ReceiptMcpProduct from './components/ReceiptMcpProduct.tsx'
import DataMindProduct from './components/DataMindProduct.tsx'
import NibsProduct from './components/NibsProduct.tsx'
import CladgetProduct from './components/CladgetProduct.tsx'
import CustomAI from './components/CustomAI.tsx'
import { usePageTracking } from './hooks/usePageTracking.ts'

// Lazily loaded so the dashboard — charts, tables, admin API client — never
// lands in the bundle a marketing visitor downloads.
const AdminPage = lazy(() => import('./admin/AdminPage.tsx'))

export default function AppRoutes() {
  // Fires a GA4 page_view on the initial load and on every route change.
  usePageTracking()

  const location = useLocation()
  // The dashboard sets no third-party cookies and does not run GA4, so a
  // consent banner there would be asking permission for nothing.
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/receipt-mcp" element={<ReceiptMcpProduct />} />
      <Route path="/products/datamind-curator" element={<DataMindProduct />} />
      <Route path="/products/nibs" element={<NibsProduct />} />
      <Route path="/cladget" element={<CladgetProduct />} />
      <Route path="/custom-ai-integration" element={<CustomAI />} />
      <Route path="/nibs" element={<NibsPrivacy />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={null}>
            <AdminPage />
          </Suspense>
        }
      />
    </Routes>
    {!isAdmin && <ConsentBanner />}
    </>
  )
}
