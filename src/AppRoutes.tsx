import { Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import NibsPrivacy from './components/NibsPrivacy.tsx'
import Products from './components/Products.tsx'
import ReceiptMcpProduct from './components/ReceiptMcpProduct.tsx'
import DataMindProduct from './components/DataMindProduct.tsx'
import NibsProduct from './components/NibsProduct.tsx'
import CladgetProduct from './components/CladgetProduct.tsx'
import CustomAI from './components/CustomAI.tsx'
import { usePageTracking } from './hooks/usePageTracking.ts'

export default function AppRoutes() {
  // Fires a GA4 page_view on the initial load and on every route change.
  usePageTracking()

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/receipt-mcp" element={<ReceiptMcpProduct />} />
      <Route path="/products/datamind-curator" element={<DataMindProduct />} />
      <Route path="/products/nibs" element={<NibsProduct />} />
      <Route path="/cladget" element={<CladgetProduct />} />
      <Route path="/custom-ai-integration" element={<CustomAI />} />
      <Route path="/nibs" element={<NibsPrivacy />} />
    </Routes>
  )
}
