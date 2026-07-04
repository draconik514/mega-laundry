import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Orders from '../pages/Orders'
import OrderDetail from '../pages/OrderDetail'
import Services from '../pages/Services'
import Customer from '../pages/Customer'
import CustomerTracking from '../pages/CustomerTracking'
import Reports from '../pages/Reports'
import Profile from '../pages/Profile'
import Feedbacks from '../pages/Feedbacks'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner fullScreen />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

const Router = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/customer" element={<Customer />} />
      <Route path="/customer/track" element={<CustomerTracking />} />
      <Route path="/customer/track/:code" element={<CustomerTracking />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/orders" element={
        <PrivateRoute>
          <Layout>
            <Orders />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/orders/:code" element={
        <PrivateRoute>
          <Layout>
            <OrderDetail />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/services" element={
        <PrivateRoute>
          <Layout>
            <Services />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/reports" element={
        <PrivateRoute>
          <Layout>
            <Reports />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/profile" element={
        <PrivateRoute>
          <Layout>
            <Profile />
          </Layout>
        </PrivateRoute>
      } />

      <Route path="/feedbacks" element={
        <PrivateRoute>
          <Layout>
            <Feedbacks />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default Router
