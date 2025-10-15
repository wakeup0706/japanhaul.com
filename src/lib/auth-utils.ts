import React from 'react';
import { useRouter } from 'next/navigation';
import { auth } from './firebase';
import { User } from 'firebase/auth';

/**
 * Check if user is currently authenticated
 * @returns Promise<boolean> - true if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
}

/**
 * Get current authenticated user
 * @returns Promise<User | null> - current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Check authentication and redirect if not authenticated
 * @param redirectTo - URL to redirect to if not authenticated
 * @returns Promise<{authenticated: boolean, user: User | null}>
 */
export async function checkAuthAndRedirect(redirectTo: string = '/login'): Promise<{authenticated: boolean, user: User | null}> {
  const user = await getCurrentUser();

  if (!user) {
    // In a client-side context, we can't directly redirect
    // This should be handled by the component using this function
    return { authenticated: false, user: null };
  }

  return { authenticated: true, user };
}

/**
 * Higher-order function for protecting pages that require authentication
 * @param WrappedComponent - The component to protect
 * @returns Protected component that checks authentication
 */
export function withAuthProtection<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function AuthProtectedComponent(props: P) {
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [user, setUser] = React.useState<User | null>(null);
    const router = useRouter();

    React.useEffect(() => {
      const checkAuth = async () => {
        const authResult = await checkAuthAndRedirect();

        if (!authResult.authenticated) {
          // Redirect to login page
          router.push('/login?message=Please login to access checkout');
          return;
        }

        setIsAuthenticated(true);
        setUser(authResult.user);
        setIsLoading(false);
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect via useEffect
    }

    return <WrappedComponent {...props} />;
  };
}
