import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';

export const appRoutes: Routes = [
    {
        path: 'test',
        component: AppLayout,
        children: [
            {
                path: '',
                data: { breadcrumb: 'E-Commerce Dashboard' },
                loadComponent: () => import('@/pages/dashboard/ecommercedashboard').then((c) => c.EcommerceDashboard)
            },
            {
                path: 'uikit',
                data: { breadcrumb: 'UI Kit' },
                loadChildren: () => import('@/pages/uikit/uikit.routes')
            },
            {
                path: 'pages',
                data: { breadcrumb: 'Pages' },
                loadChildren: () => import('@/pages/pages.routes')
            }
        ]
    },
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                data: { breadcrumb: 'E-Commerce Dashboard' },
                loadComponent: () => import('@/pages/main/main').then((c) => c.Main)
            }
        ]
    },
    { path: 'auth', loadChildren: () => import('@/pages/auth/auth.routes') },
    {
        path: 'notfound',
        loadComponent: () => import('@/pages/notfound/notfound').then((c) => c.Notfound)
    },
    { path: '**', redirectTo: '/notfound' }
];
