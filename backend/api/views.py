"""
API Views for SurfaceFlow AI System
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'service': 'SurfaceFlow AI System',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login endpoint - Mock implementation"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Mock authentication - replace with real auth in production
    if email and password:
        return Response({
            'success': True,
            'token': 'mock-jwt-token-12345',
            'user': {
                'id': 1,
                'email': email,
                'name': 'Demo User',
                'role': 'admin'
            }
        })
    
    return Response({
        'success': False,
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """User logout endpoint"""
    return Response({
        'success': True,
        'message': 'Logged out successfully'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def current_user(request):
    """Get current user info - Mock implementation"""
    return Response({
        'id': 1,
        'email': 'demo@surfaceflow.ai',
        'name': 'Demo User',
        'role': 'admin',
        'permissions': ['modules.view', 'modules.manage', 'automations.run']
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_modules(request):
    """List all available automation modules"""
    modules = [
        {
            'id': 'AM-001',
            'name': 'Core Platform',
            'description': 'Core SurfaceFlow platform functionality',
            'status': 'active',
            'version': '1.0.0'
        },
        {
            'id': 'AM-002',
            'name': 'BuilderTrend Hotel Booking',
            'description': 'Automated hotel booking from BuilderTrend job data',
            'status': 'active',
            'version': '1.0.0',
            'features': [
                'Job data extraction from BuilderTrend',
                'OTA price comparison (ARB, Expedia, Kayak, Booking.com, Hotels.com)',
                'Internal housing inventory check',
                'AI-powered best deal selection',
                'One-click booking approval'
            ]
        },
        {
            'id': 'AM-003',
            'name': 'ServiceTitan Integration',
            'description': 'Service dispatch automation for ServiceTitan',
            'status': 'coming_soon',
            'version': None
        }
    ]
    
    return Response({
        'success': True,
        'modules': modules,
        'total': len(modules)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def module_detail(request, module_id):
    """Get details of a specific module"""
    modules = {
        'AM-002': {
            'id': 'AM-002',
            'name': 'BuilderTrend Hotel Booking',
            'description': 'Automated hotel booking from BuilderTrend job data',
            'status': 'active',
            'version': '1.0.0',
            'configuration': {
                'ota_sources': ['internal', 'airbnb', 'expedia', 'kayak', 'booking', 'hotels'],
                'auto_approve_threshold': 150.00,
                'notification_channels': ['sms', 'email', 'portal']
            },
            'statistics': {
                'total_bookings': 245,
                'avg_savings': 47.50,
                'success_rate': 98.5
            }
        }
    }
    
    if module_id in modules:
        return Response({
            'success': True,
            'module': modules[module_id]
        })
    
    return Response({
        'success': False,
        'error': 'Module not found'
    }, status=status.HTTP_404_NOT_FOUND)
