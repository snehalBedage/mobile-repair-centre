from django.urls import path

from .views import (
    CustomerListCreateView,
    CustomerDetailView,
     CustomerProfileView,
    DeviceListCreateView,
    DeviceDetailView,
)


urlpatterns = [

    # Customer APIs
    path(
        '',
        CustomerListCreateView.as_view(),
        name='customer-list-create'
    ),

    path(
        '<int:pk>/',
        CustomerDetailView.as_view(),
        name='customer-detail'
    ),

        path(
        'my-profile/',
        CustomerProfileView.as_view(),
        name='customer-profile'
    ),

    # Device APIs
    path(
        'devices/',
        DeviceListCreateView.as_view(),
        name='device-list-create'
    ),

    path(
        'devices/<int:pk>/',
        DeviceDetailView.as_view(),
        name='device-detail'
    ),
]