import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import NibsPrivacy from './components/NibsPrivacy.tsx'
import Products from './components/Products.tsx'
import ReceiptMcpProduct from './components/ReceiptMcpProduct.tsx'
import DataMindProduct from './components/DataMindProduct.tsx'
import NibsProduct from './components/NibsProduct.tsx'
import TinyWinsProduct from './components/TinyWinsProduct.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/receipt-mcp" element={<ReceiptMcpProduct />} />
        <Route path="/products/datamind-curator" element={<DataMindProduct />} />
        <Route path="/products/nibs" element={<NibsProduct />} />
        <Route path="/products/tinywins" element={<TinyWinsProduct />} />
        <Route path="/nibs" element={<NibsPrivacy />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
