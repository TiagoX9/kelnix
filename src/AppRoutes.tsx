import { Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import NibsPrivacy from './components/NibsPrivacy.tsx'
import Products from './components/Products.tsx'
import ReceiptMcpProduct from './components/ReceiptMcpProduct.tsx'
import DataMindProduct from './components/DataMindProduct.tsx'
import NibsProduct from './components/NibsProduct.tsx'
import TinyWinsProduct from './components/TinyWinsProduct.tsx'
import TinyWinsPrivacy from './components/TinyWinsPrivacy.tsx'
import TinyWinsDeleteAccount from './components/TinyWinsDeleteAccount.tsx'
import TinyWinsTerms from './components/TinyWinsTerms.tsx'
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
      <Route path="/products/tinywins" element={<TinyWinsProduct />} />
      <Route path="/tinywins" element={<TinyWinsPrivacy />} />
      <Route path="/tinywins/terms" element={<TinyWinsTerms />} />
      <Route path="/tinywins/delete-account" element={<TinyWinsDeleteAccount />} />
      <Route path="/nibs" element={<NibsPrivacy />} />
    </Routes>
  )
}
