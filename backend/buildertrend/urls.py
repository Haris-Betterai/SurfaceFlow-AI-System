"""
BuilderTrend Hotel Booking Module URL Configuration
"""
from django.urls import path
from . import views

urlpatterns = [
    # Hotel booking endpoints
    path('hotel-booking/search/', views.search_hotels, name='search_hotels'),
    path('hotel-booking/run/', views.run_hotel_search, name='run_hotel_search'),
    path('hotel-booking/approve/', views.approve_booking, name='approve_booking'),
    path('hotel-booking/status/<str:job_id>/', views.booking_status, name='booking_status'),
    path('hotel-booking/history/', views.booking_history, name='booking_history'),
    
    # CSV Data endpoints (for Portal display)
    path('hotel-booking/searches/', views.get_hotel_searches, name='get_hotel_searches'),
    path('hotel-booking/approvals/', views.get_booking_approvals, name='get_booking_approvals'),
    
    # Job data endpoints
    path('jobs/', views.list_jobs, name='list_jobs'),
    path('jobs/<str:job_id>/', views.job_detail, name='job_detail'),
    path('jobs/<str:job_id>/sync/', views.sync_job, name='sync_job'),
]
