
import os

from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.conf import settings

from rest_framework import status
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    CustomerRegistrationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UserManagementSerializer,
    StaffCreateSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class AdminTestView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            "message": "Admin access granted",
            "role": request.user.role,
        })


class CustomerRegistrationView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = CustomerRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response({
                "message": "Customer registration successful.",
                "customer": {
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                },
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class ForgotPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data["email"]

            user = User.objects.filter(
                email=email,
                is_active=True,
            ).first()

            # Do not reveal whether the email exists.
            if user:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)

                reset_link = (
                     f"{settings.FRONTEND_URL.rstrip('/')}"
                     f"/reset-password/{uid}/{token}/"
                )
                send_mail(
                    subject="Password Reset - Mobile Repair Centre",
                    message=f"""
Hello {user.name},

We received a request to reset your password.

Click the link below to reset your password:

{reset_link}

If you did not request this password reset, please ignore this email.

Regards,
Mobile Repair Centre
""",
                    from_email=os.getenv("EMAIL_HOST_USER"),
                    recipient_list=[user.email],
                    fail_silently=False,
                )

            return Response({
                "message": (
                    "If an account with this email exists, "
                    "a password reset link has been sent."
                ),
            }, status=status.HTTP_200_OK)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class ResetPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")

        if not uid or not token:
            return Response({
                "message": "Invalid password reset request.",
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ResetPasswordSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from django.utils.http import urlsafe_base64_decode

            user_id = urlsafe_base64_decode(uid).decode()

            user = User.objects.get(
                pk=user_id,
                is_active=True,
            )

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist,
        ):
            return Response({
                "message": "Invalid or expired reset link.",
            }, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({
                "message": "Invalid or expired reset link.",
            }, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({
            "message": (
                "Password reset successful. "
                "You can now login with your new password."
            ),
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "name": request.user.name,
            "email": request.user.email,
            "role": request.user.role,
            "is_active": request.user.is_active,
        }, status=status.HTTP_200_OK)


class UserManagementListCreateView(ListCreateAPIView):
    """
    Admin can list users, search/filter users and create Staff accounts.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = User.objects.all().order_by("-created_at")

        search = self.request.query_params.get("search", "").strip()
        role = self.request.query_params.get("role", "").strip().upper()
        active = self.request.query_params.get("active", "").strip().lower()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
            )

        valid_roles = ["ADMIN", "STAFF", "CUSTOMER"]

        if role:
            if role not in valid_roles:
                return User.objects.none()

            queryset = queryset.filter(role=role)

        if active in ["true", "false"]:
            queryset = queryset.filter(is_active=(active == "true"))

        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StaffCreateSerializer

        return UserManagementSerializer


class UserManagementStatusView(APIView):
    """Admin can activate or deactivate a user."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)

        except User.DoesNotExist:
            return Response(
                {"message": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.pk == request.user.pk:
            return Response(
                {"message": "You cannot deactivate your own account here."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "is_active" not in request.data:
            return Response(
                {"is_active": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        value = request.data["is_active"]

        if not isinstance(value, bool):
            return Response(
                {"is_active": "Provide true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = value
        user.save(update_fields=["is_active", "updated_at"])

        return Response({
            "message": "User status updated successfully.",
            "user": UserManagementSerializer(user).data,
        }, status=status.HTTP_200_OK)


class UserManagementDeleteView(APIView):
    """
    Admin can delete users when related records do not prevent deletion.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)

        except User.DoesNotExist:
            return Response(
                {"message": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.pk == request.user.pk:
            return Response(
                {"message": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role == "ADMIN" and user.is_active:
            active_admins = User.objects.filter(
                role="ADMIN",
                is_active=True,
            ).count()

            if active_admins <= 1:
                return Response(
                    {"message": "The last active admin cannot be deleted."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Check reverse relations before attempting deletion.
        for relation in user._meta.related_objects:
            accessor_name = relation.get_accessor_name()

            if accessor_name == "+":
                continue

            related_manager = getattr(user, accessor_name, None)

            if related_manager is None:
                continue

            if relation.one_to_one:
                if related_manager is not None:
                    return Response(
                        {
                            "message": (
                                "This user has related records. "
                                "Deactivate the account instead."
                            ),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

            elif related_manager.exists():
                return Response(
                    {
                        "message": (
                            "This user has related records. "
                            "Deactivate the account instead."
                        ),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        user.delete()

        return Response(
            {"message": "User deleted successfully."},
            status=status.HTTP_200_OK,
        )
