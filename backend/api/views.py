from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserBehavior

# -------------------- SIGNUP --------------------
@api_view(['POST'])
def signup_user(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password required'}, status=400)

    if User.objects.filter(username=email).exists():
        return Response({'error': 'User already exists'}, status=400)

    # Create the new user
    user = User.objects.create_user(username=email, email=email, password=password)

    # Generate participant ID (incremental P001, P002, etc.)
    user_count = User.objects.count()
    participant_id = f"P{user_count:03d}"

    # Log initial user behavior
    UserBehavior.objects.create(
        user=user,
        participant_id=participant_id,
        scroll_velocity=0,
        hover_duration="0s",
        click_error_rate=0,
        focus_mode="Inactive",
        action="Account Created"
    )

    return Response({
        'message': 'User created successfully',
        'participant_id': participant_id
    }, status=201)


# -------------------- LOGIN --------------------
@api_view(['POST'])
def login_user(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        user = User.objects.get(username=email)
    except User.DoesNotExist:
        return Response({'error': 'Invalid email or password'}, status=400)

    if not user.check_password(password):
        return Response({'error': 'Invalid email or password'}, status=400)

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Login successful',
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {'id': user.id, 'email': user.email}
    })


# -------------------- GET PARTICIPANT ID --------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_participant_id(request):
    user = request.user
    behavior = UserBehavior.objects.filter(user=user).first()

    if behavior:
        return Response({'participant_id': behavior.participant_id})
    else:
        # fallback (in case no behavior was logged yet)
        participant_id = f"P{user.id:03d}"
        return Response({'participant_id': participant_id})


# -------------------- SAVE USER BEHAVIOR --------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_behavior(request):
    user = request.user
    data = request.data

    if not data:
        return Response({"error": "Empty data"}, status=400)

    # Retrieve the participant_id assigned to this user
    existing_behavior = UserBehavior.objects.filter(user=user).first()
    participant_id = existing_behavior.participant_id if existing_behavior else f"P{user.id:03d}"

    # Define the canonical action categories
    VALID_ACTIONS = [
        "Normal", "Normal Layout", "Slow Scroll Detected", "Hovering over classes",
        "Focus View", "Click Error Mode", "UI Dimmed", "UI Restored (User Idle)",
        "Enlarge Mode", "Account Created",
    ]

    # Map raw frontend actions to the canonical categories
    raw_action = data.get("action", "Normal Layout")
    action_map = {
        "Hovering over element": "Hovering over classes",
        "Scroll Velocity (<30px/s)": "Slow Scroll Detected",
        "Click Error Rate Trigger (>15%)": "Click Error Mode",
        "UI Dimmed": "UI Dimmed",
        "UI Restored (User Idle)": "UI Restored (User Idle)",
        "Focus View": "Focus View",
        "Enlarge Mode": "Enlarge Mode",
        "Action": "Normal Layout",   # fallback
    }

    # Convert any frontend variation to a valid action
    action = action_map.get(raw_action, raw_action)
    if action not in VALID_ACTIONS:
        action = "Normal"

    # (Optional) debug log
    print(f"🧠 Behavior recorded for {user.username}: {action}")

    # Save the behavior record
    UserBehavior.objects.create(
        user=user,
        participant_id=participant_id,
        scroll_velocity=data.get("scroll_velocity", 0),
        hover_duration=data.get("hover_duration", "0s"),
        click_error_rate=data.get("click_error_rate", 0),
        focus_mode=data.get("focus_mode", "Inactive"),
        action=action,
    )

    return Response({"message": "Behavior saved successfully"}, status=201)