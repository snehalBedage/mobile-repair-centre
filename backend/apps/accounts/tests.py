
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

from apps.accounts.models import User


class LoginAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.password = "TestPassword@123"

        self.user = User.objects.create_user(
            email="login-test@example.com",
            name="Login Test User",
            password=self.password,
            role="ADMIN",
        )

        self.login_url = reverse("token_obtain_pair")

    def test_admin_login_with_correct_password(self):
        response = self.client.post(
            self.login_url,
            {
                "email": self.user.email,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["role"], "ADMIN")

    def test_login_with_wrong_password(self):
        response = self.client.post(
            self.login_url,
            {
                "email": self.user.email,
                "password": "WrongPassword@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
