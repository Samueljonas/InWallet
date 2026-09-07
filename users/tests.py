from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class UserAPITests(APITestCase):
    def test_user_registration_api(self):
        url = '/accounts/api/v1/auth/register/'
        payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_jwt_token_obtain(self):
        User.objects.create_user(
            username='authuser',
            email='auth@example.com',
            password='MyPassword123!'
        )
        url = '/accounts/api/v1/auth/token/'
        payload = {
            'username': 'authuser',
            'password': 'MyPassword123!'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
