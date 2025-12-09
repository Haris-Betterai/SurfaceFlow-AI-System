"""
BuilderTrend Hotel Booking Module Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import uuid
import random
import csv
import os


# In-memory storage for demo (replace with database in production)
BOOKING_JOBS = {}
SYNCED_JOBS = {}

# CSV file paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
HOTEL_SEARCHES_CSV = os.path.join(DATA_DIR, 'hotel_searches.csv')
BOOKING_APPROVALS_CSV = os.path.join(DATA_DIR, 'booking_approvals.csv')


def save_hotel_search_to_csv(job_data, booking_job_id, source):
    """Save hotel search request to CSV file"""
    try:
        address = job_data.get('address', {})
        row = {
            'id': str(uuid.uuid4())[:8],
            'job_id': job_data.get('jobId', 'N/A'),
            'job_name': job_data.get('jobName', 'N/A'),
            'job_code': job_data.get('jobCode', 'N/A'),
            'street': address.get('street', 'N/A') if isinstance(address, dict) else 'N/A',
            'city': address.get('city', 'N/A') if isinstance(address, dict) else 'N/A',
            'state': address.get('state', 'N/A') if isinstance(address, dict) else 'N/A',
            'zip': address.get('zip', 'N/A') if isinstance(address, dict) else 'N/A',
            'formatted_address': address.get('formatted', str(address)) if isinstance(address, dict) else str(address),
            'start_date': job_data.get('startDate', 'N/A'),
            'end_date': job_data.get('endDate', 'N/A'),
            'guests': job_data.get('numberOfGuests', 'N/A'),
            'special_requirements': job_data.get('specialRequirements', 'None'),
            'source': source,
            'booking_job_id': booking_job_id,
            'status': 'pending_approval',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Append to CSV
        file_exists = os.path.exists(HOTEL_SEARCHES_CSV)
        with open(HOTEL_SEARCHES_CSV, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=row.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)
        
        print(f"💾 Saved to CSV: {HOTEL_SEARCHES_CSV}")
        return True
    except Exception as e:
        print(f"❌ Error saving to CSV: {e}")
        return False


def save_booking_approval_to_csv(booking_job_id, hotel_id, hotel_name, price):
    """Save booking approval to CSV file"""
    try:
        row = {
            'id': str(uuid.uuid4())[:8],
            'booking_job_id': booking_job_id,
            'hotel_id': hotel_id,
            'hotel_name': hotel_name,
            'price': price,
            'status': 'approved',
            'approved_at': datetime.utcnow().isoformat(),
            'confirmation_number': f'SF-{booking_job_id.upper()}'
        }
        
        # Append to CSV
        file_exists = os.path.exists(BOOKING_APPROVALS_CSV)
        with open(BOOKING_APPROVALS_CSV, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=row.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)
        
        print(f"💾 Saved approval to CSV: {BOOKING_APPROVALS_CSV}")
        return True
    except Exception as e:
        print(f"❌ Error saving approval to CSV: {e}")
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def search_hotels(request):
    """
    Search for hotels based on job location.
    Called from Chrome extension when user clicks "Book Hotel with AI"
    """
    # ========== PRINT STATEMENTS FOR TERMINAL VISIBILITY ==========
    print("\n" + "=" * 60)
    print("🏨 SURFACEFLOW - HOTEL SEARCH REQUEST RECEIVED!")
    print("=" * 60)
    
    job_data = request.data.get('job_data', {})
    
    print(f"📋 Job Data Received:")
    print(f"   • Job ID: {job_data.get('jobId', 'N/A')}")
    print(f"   • Job Name: {job_data.get('jobName', 'N/A')}")
    print(f"   • Job Code: {job_data.get('jobCode', 'N/A')}")
    print(f"   • Address: {job_data.get('address', 'N/A')}")
    print(f"   • Start Date: {job_data.get('startDate', 'N/A')}")
    print(f"   • End Date: {job_data.get('endDate', 'N/A')}")
    print(f"   • Guests: {job_data.get('numberOfGuests', 'N/A')}")
    print(f"   • Special Requirements: {job_data.get('specialRequirements', 'None')}")
    print(f"   • Source: {request.data.get('source', 'chrome_extension')}")
    print("=" * 60 + "\n")
    
    if not job_data:
        return Response({
            'success': False,
            'error': 'Job data is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    job_id = job_data.get('jobId', 'unknown')
    location = job_data.get('address', {})
    
    # Store synced job data
    SYNCED_JOBS[job_id] = {
        **job_data,
        'synced_at': datetime.utcnow().isoformat(),
        'source': 'chrome_extension'
    }
    
    # Generate mock hotel results from different OTA sources
    hotels = generate_mock_hotels(location)
    
    # Create booking job
    booking_job_id = str(uuid.uuid4())[:8]
    BOOKING_JOBS[booking_job_id] = {
        'id': booking_job_id,
        'job_id': job_id,
        'job_data': job_data,
        'hotels': hotels,
        'status': 'pending_approval',
        'created_at': datetime.utcnow().isoformat(),
        'recommended': hotels[0] if hotels else None  # Best deal
    }
    
    # ========== SAVE TO CSV ==========
    source = request.data.get('source', 'chrome_extension')
    save_hotel_search_to_csv(job_data, booking_job_id, source)
    
    return Response({
        'success': True,
        'booking_job_id': booking_job_id,
        'job_id': job_id,
        'location': location,
        'hotels': hotels,
        'recommended': hotels[0] if hotels else None,
        'total_sources_searched': 6,
        'sources': ['Internal Housing', 'Airbnb', 'Expedia', 'Kayak', 'Booking.com', 'Hotels.com']
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def run_hotel_search(request):
    """
    Trigger a hotel search automation job.
    Alternative endpoint for portal-initiated searches.
    """
    job_id = request.data.get('job_id')
    check_in = request.data.get('check_in')
    check_out = request.data.get('check_out')
    
    if not job_id:
        return Response({
            'success': False,
            'error': 'job_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create automation job
    automation_id = str(uuid.uuid4())[:8]
    
    return Response({
        'success': True,
        'automation_id': automation_id,
        'job_id': job_id,
        'status': 'running',
        'message': 'Hotel search automation started',
        'estimated_completion': '30 seconds'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def approve_booking(request):
    """
    Approve and confirm a hotel booking.
    """
    # ========== PRINT STATEMENTS FOR TERMINAL VISIBILITY ==========
    print("\n" + "=" * 60)
    print("✅ SURFACEFLOW - BOOKING APPROVAL REQUEST RECEIVED!")
    print("=" * 60)
    
    booking_job_id = request.data.get('booking_job_id')
    hotel_id = request.data.get('hotel_id')
    
    print(f"📋 Approval Data:")
    print(f"   • Booking Job ID: {booking_job_id}")
    print(f"   • Hotel ID: {hotel_id}")
    print("=" * 60 + "\n")
    
    if not booking_job_id:
        return Response({
            'success': False,
            'error': 'booking_job_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if booking_job_id in BOOKING_JOBS:
        BOOKING_JOBS[booking_job_id]['status'] = 'approved'
        BOOKING_JOBS[booking_job_id]['approved_at'] = datetime.utcnow().isoformat()
        BOOKING_JOBS[booking_job_id]['selected_hotel_id'] = hotel_id
        
        # Get hotel details for CSV
        hotels = BOOKING_JOBS[booking_job_id].get('hotels', [])
        selected_hotel = next((h for h in hotels if h.get('id') == hotel_id), {})
        hotel_name = selected_hotel.get('name', 'Unknown Hotel')
        price = selected_hotel.get('price', 0)
        
        # ========== SAVE TO CSV ==========
        save_booking_approval_to_csv(booking_job_id, hotel_id, hotel_name, price)
        
        return Response({
            'success': True,
            'booking_job_id': booking_job_id,
            'status': 'approved',
            'confirmation_number': f'SF-{booking_job_id.upper()}',
            'message': 'Booking approved successfully'
        })
    
    return Response({
        'success': False,
        'error': 'Booking job not found'
    }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_hotel_searches(request):
    """
    Get all hotel search records from CSV for portal display.
    """
    try:
        searches = []
        if os.path.exists(HOTEL_SEARCHES_CSV):
            with open(HOTEL_SEARCHES_CSV, 'r') as f:
                reader = csv.DictReader(f)
                searches = list(reader)
        
        return Response({
            'success': True,
            'count': len(searches),
            'searches': searches
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_booking_approvals(request):
    """
    Get all booking approval records from CSV for portal display.
    """
    try:
        approvals = []
        if os.path.exists(BOOKING_APPROVALS_CSV):
            with open(BOOKING_APPROVALS_CSV, 'r') as f:
                reader = csv.DictReader(f)
                approvals = list(reader)
        
        return Response({
            'success': True,
            'count': len(approvals),
            'approvals': approvals
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def booking_status(request, job_id):
    """
    Get the status of a booking for a specific job.
    """
    for booking_job_id, booking in BOOKING_JOBS.items():
        if booking.get('job_id') == job_id:
            return Response({
                'success': True,
                'booking': booking
            })
    
    return Response({
        'success': False,
        'error': 'No booking found for this job'
    }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def booking_history(request):
    """
    Get booking history with optional filters.
    """
    # Get query parameters
    page = int(request.query_params.get('page', 1))
    per_page = int(request.query_params.get('per_page', 10))
    status_filter = request.query_params.get('status')
    
    bookings = list(BOOKING_JOBS.values())
    
    if status_filter:
        bookings = [b for b in bookings if b.get('status') == status_filter]
    
    # Pagination
    start = (page - 1) * per_page
    end = start + per_page
    paginated = bookings[start:end]
    
    return Response({
        'success': True,
        'bookings': paginated,
        'total': len(bookings),
        'page': page,
        'per_page': per_page
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_jobs(request):
    """
    List all synced BuilderTrend jobs.
    """
    jobs = list(SYNCED_JOBS.values())
    
    return Response({
        'success': True,
        'jobs': jobs,
        'total': len(jobs)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def job_detail(request, job_id):
    """
    Get details of a specific synced job.
    """
    if job_id in SYNCED_JOBS:
        return Response({
            'success': True,
            'job': SYNCED_JOBS[job_id]
        })
    
    return Response({
        'success': False,
        'error': 'Job not found'
    }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def sync_job(request, job_id):
    """
    Sync/update job data from Chrome extension.
    """
    job_data = request.data.get('job_data', {})
    
    SYNCED_JOBS[job_id] = {
        **job_data,
        'jobId': job_id,
        'synced_at': datetime.utcnow().isoformat(),
        'source': request.data.get('source', 'api')
    }
    
    return Response({
        'success': True,
        'message': 'Job synced successfully',
        'job': SYNCED_JOBS[job_id]
    })


def generate_mock_hotels(location):
    """
    Generate mock hotel results from different OTA sources.
    """
    city = location.get('city', 'Unknown City')
    state = location.get('state', '')
    
    base_hotels = [
        {
            'id': 'hotel-001',
            'name': 'SurfaceFlow Internal Housing',
            'source': 'Internal Housing',
            'source_icon': '🏠',
            'address': f'123 Company Blvd, {city}, {state}',
            'price_per_night': 0,
            'total_price': 0,
            'rating': 5.0,
            'amenities': ['Free WiFi', 'Kitchen', 'Washer/Dryer', 'Free Parking'],
            'availability': True,
            'is_internal': True,
            'savings': 175.00,
            'image_url': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
        },
        {
            'id': 'hotel-002',
            'name': f'Comfort Suites {city}',
            'source': 'Airbnb',
            'source_icon': '🏡',
            'address': f'456 Main St, {city}, {state}',
            'price_per_night': 89.00,
            'total_price': 267.00,
            'rating': 4.5,
            'amenities': ['Free WiFi', 'Pool', 'Breakfast Included'],
            'availability': True,
            'is_internal': False,
            'savings': 45.00,
            'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
        },
        {
            'id': 'hotel-003',
            'name': f'Hampton Inn {city} Downtown',
            'source': 'Expedia',
            'source_icon': '✈️',
            'address': f'789 Commerce Way, {city}, {state}',
            'price_per_night': 125.00,
            'total_price': 375.00,
            'rating': 4.3,
            'amenities': ['Free WiFi', 'Gym', 'Business Center', 'Breakfast'],
            'availability': True,
            'is_internal': False,
            'savings': 28.00,
            'image_url': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400'
        },
        {
            'id': 'hotel-004',
            'name': f'Holiday Inn Express {city}',
            'source': 'Kayak',
            'source_icon': '🛶',
            'address': f'321 Airport Rd, {city}, {state}',
            'price_per_night': 109.00,
            'total_price': 327.00,
            'rating': 4.1,
            'amenities': ['Free WiFi', 'Pool', 'Breakfast', 'Shuttle'],
            'availability': True,
            'is_internal': False,
            'savings': 35.00,
            'image_url': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
        },
        {
            'id': 'hotel-005',
            'name': f'Marriott {city} Waterfront',
            'source': 'Booking.com',
            'source_icon': '🅱️',
            'address': f'555 Harbor Dr, {city}, {state}',
            'price_per_night': 189.00,
            'total_price': 567.00,
            'rating': 4.7,
            'amenities': ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar'],
            'availability': True,
            'is_internal': False,
            'savings': 0,
            'image_url': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400'
        },
        {
            'id': 'hotel-006',
            'name': f'Best Western Plus {city}',
            'source': 'Hotels.com',
            'source_icon': '🏨',
            'address': f'888 Industrial Pkwy, {city}, {state}',
            'price_per_night': 95.00,
            'total_price': 285.00,
            'rating': 4.0,
            'amenities': ['Free WiFi', 'Pool', 'Pet Friendly', 'Breakfast'],
            'availability': True,
            'is_internal': False,
            'savings': 40.00,
            'image_url': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400'
        }
    ]
    
    # Sort by price (internal housing first as it's free)
    return sorted(base_hotels, key=lambda x: x['total_price'])
