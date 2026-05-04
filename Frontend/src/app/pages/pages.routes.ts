import {Routes} from '@angular/router';
import {Crud} from './crud/crud';
import {Empty} from './empty/empty';
import {AboutUs} from './aboutus/aboutus';
import {User} from './user/user';

export default [
    { path: 'aboutus', data: { breadcrumb: 'About' }, component: AboutUs },
    { path: 'crud', data: { breadcrumb: 'Crud' }, component: Crud },
    { path: 'empty', data: { breadcrumb: 'Empty' }, component: Empty },
    { path: 'user', data: { breadcrumb: 'Profile' }, component: User },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
