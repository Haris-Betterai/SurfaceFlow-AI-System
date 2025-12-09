"""
Automations Module Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import uuid


# In-memory storage for demo
AUTOMATION_JOBS = {}


@api_view(['GET'])
@permission_classes([AllowAny])
def list_automations(request):
    """
    List all automation jobs with optional filtering.
    """
    status_filter = request.query_params.get('status')
    module_filter = request.query_params.get('module')
    
    jobs = list(AUTOMATION_JOBS.values())
    
    if status_filter:
        jobs = [j for j in jobs if j.get('status') == status_filter]
    if module_filter:
        jobs = [j for j in jobs if j.get('module') == module_filter]
    
    return Response({
        'success': True,
        'automations': jobs,
        'total': len(jobs)
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_automation(request):
    """
    Trigger a new automation job.
    """
    module = request.data.get('module')
    action = request.data.get('action')
    params = request.data.get('params', {})
    
    if not module or not action:
        return Response({
            'success': False,
            'error': 'module and action are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    job_id = str(uuid.uuid4())[:8]
    
    AUTOMATION_JOBS[job_id] = {
        'id': job_id,
        'module': module,
        'action': action,
        'params': params,
        'status': 'running',
        'created_at': datetime.utcnow().isoformat(),
        'progress': 0,
        'logs': [
            {'timestamp': datetime.utcnow().isoformat(), 'message': 'Automation started'}
        ]
    }
    
    return Response({
        'success': True,
        'job_id': job_id,
        'status': 'running',
        'message': f'Automation {action} started for module {module}'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def automation_detail(request, job_id):
    """
    Get details of a specific automation job.
    """
    if job_id in AUTOMATION_JOBS:
        return Response({
            'success': True,
            'automation': AUTOMATION_JOBS[job_id]
        })
    
    return Response({
        'success': False,
        'error': 'Automation job not found'
    }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_automation(request, job_id):
    """
    Cancel a running automation job.
    """
    if job_id in AUTOMATION_JOBS:
        AUTOMATION_JOBS[job_id]['status'] = 'cancelled'
        AUTOMATION_JOBS[job_id]['cancelled_at'] = datetime.utcnow().isoformat()
        
        return Response({
            'success': True,
            'job_id': job_id,
            'status': 'cancelled',
            'message': 'Automation cancelled'
        })
    
    return Response({
        'success': False,
        'error': 'Automation job not found'
    }, status=status.HTTP_404_NOT_FOUND)
