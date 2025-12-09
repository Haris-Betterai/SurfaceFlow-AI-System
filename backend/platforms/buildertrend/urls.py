"""
BuilderTrend Platform URL Configuration
"""
from django.urls import path, include

# Import from the existing buildertrend app for now
# TODO: Migrate views to platforms/buildertrend/hotel_booking/views.py
from buildertrend import views as hotel_views

urlpatterns = [
    # Hotel booking endpoints (using existing buildertrend views)
    path('hotel-booking/search/', hotel_views.search_hotels, name='search_hotels'),
    path('hotel-booking/run/', hotel_views.run_hotel_search, name='run_hotel_search'),
    path('hotel-booking/approve/', hotel_views.approve_booking, name='approve_booking'),
    path('hotel-booking/status/<str:job_id>/', hotel_views.booking_status, name='booking_status'),
    path('hotel-booking/history/', hotel_views.booking_history, name='booking_history'),
    path('hotel-booking/searches/', hotel_views.get_hotel_searches, name='get_hotel_searches'),
    path('hotel-booking/approvals/', hotel_views.get_booking_approvals, name='get_booking_approvals'),
    
    # Job data endpoints
    path('jobs/', hotel_views.list_jobs, name='list_jobs'),
    path('jobs/<str:job_id>/', hotel_views.job_detail, name='job_detail'),
    path('jobs/<str:job_id>/sync/', hotel_views.sync_job, name='sync_job'),
]
