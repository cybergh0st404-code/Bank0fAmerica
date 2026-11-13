import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/AuthContext';

export function usePageSecurity(pageId) {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [isLocked, setIsLocked] = useState(false);
  const [isAllowed, setIsAllowed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedLocked = localStorage.getItem('bank_locked_pages');
        if (cachedLocked) {
          const list = JSON.parse(cachedLocked);
          if (Array.isArray(list)) setIsLocked(list.includes(pageId));
        }
        const cachedAllowed = localStorage.getItem('bank_allowed_pages');
        if (cachedAllowed && pageId !== 'dashboard') {
          const list = JSON.parse(cachedAllowed);
          if (Array.isArray(list)) {
            const allowed = list.includes(pageId);
            setIsAllowed(allowed);
            if (!allowed) {
              router.replace('/dashboard');
              return;
            }
          }
        }
      } catch (_) {}
    }
  }, [pageId, router]);

  useEffect(() => {
    if (!user || user.role === 'admin' || user.role === 'superadmin') return;

    let isMounted = true;
    const verifyAccess = async () => {
      try {
        const res = await fetch('/api/user/account-data');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.allowedPages)) {
            const allowed = pageId === 'dashboard' || data.allowedPages.includes(pageId);
            setIsAllowed(allowed);
            try {
              localStorage.setItem('bank_allowed_pages', JSON.stringify(data.allowedPages));
            } catch (_) {}
            if (!allowed && pageId !== 'dashboard') {
              router.replace('/dashboard');
              return;
            }
          }
          if (Array.isArray(data.lockedPages)) {
            const locked = data.lockedPages.includes(pageId);
            setIsLocked(locked);
            try {
              localStorage.setItem('bank_locked_pages', JSON.stringify(data.lockedPages));
            } catch (_) {}
          }
          if (updateUser) {
            updateUser({
              allowedPages: data.allowedPages || [],
              lockedPages: data.lockedPages || [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to verify page security:', err);
      }
    };

    verifyAccess();
    return () => {
      isMounted = false;
    };
  }, [pageId, user, router, updateUser]);

  return { isLocked, isAllowed };
}

