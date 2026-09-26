import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '../api/auth'
import useAuthStore from '../store/authStore'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken)
      toast.success('Welcome back!')
      navigate('/dashboard')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed')
    },
  })
}

export function useSignup() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken)
      toast.success('Account created! Please verify your email.')
      navigate('/dashboard')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Signup failed')
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate('/login')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email }) => authApi.forgotPassword(email),
    onSuccess: () => toast.success('If that email exists, an OTP has been sent.'),
    onError: (err) => toast.error(err.response?.data?.message || 'Request failed'),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: authApi.verifyOtp,
    onError: (err) => toast.error(err.response?.data?.message || 'OTP verification failed'),
  })
}

export function useResetPassword() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset! Please log in.')
      navigate('/login')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Reset failed'),
  })
}

export function useAcceptInvite(token) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data) => authApi.acceptInvite(token, data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken)
      toast.success('Welcome to StockSense!')
      navigate('/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to accept invite'),
  })
}

export function useGetInvite(token) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => authApi.getInvite(token).then((r) => r.data.data),
    enabled: !!token,
    retry: false,
  })
}

export function useSendInvite() {
  return useMutation({
    mutationFn: authApi.sendInvite,
    onSuccess: () => toast.success('Invitation sent!'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send invite'),
  })
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => authApi.getSessions().then((r) => r.data.data),
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session revoked')
    },
  })
}
