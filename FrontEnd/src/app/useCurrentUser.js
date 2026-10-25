import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { authApi } from '../api/auth.js'
import { setCredentials, setSessionChecked } from './store.js'

export function useCurrentUser() {
  const user = useSelector((state) => state.auth.user)
  const sessionChecked = useSelector((state) => state.auth.sessionChecked)
  const dispatch = useDispatch()
  const query = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: async () => {
      const response = await authApi.currentUser()
      return response.data.data
    },
    enabled: !user && !sessionChecked,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data && !user) dispatch(setCredentials({ user: query.data }))
  }, [dispatch, query.data, user])

  useEffect(() => {
    if (query.isError) dispatch(setSessionChecked())
  }, [dispatch, query.isError])

  return {
    user: user || query.data || null,
    isLoading: !user && !sessionChecked && query.isPending,
  }
}
