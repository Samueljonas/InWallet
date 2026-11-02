from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from wallet.models import Account, Category, Transaction, Budget

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

    def test_delete_account_requires_authentication(self):
        response = self.client.delete('/api/v1/auth/account/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_account_cascades_all_financial_records(self):
        user = User.objects.create_user(
            username='delete_me',
            email='deleteme@example.com',
            password='MyPassword123!'
        )
        other_user = User.objects.create_user(
            username='keep_me',
            email='keepme@example.com',
            password='MyPassword123!'
        )

        acc = Account.objects.create(user=user, name='Nubank', balance=Decimal('1200.00'))
        cat = Category.objects.create(user=user, name='Alimentação', type='expense')
        Budget.objects.create(user=user, category=cat, amount=Decimal('500.00'))
        Transaction.objects.create(
            user=user,
            account=acc,
            category=cat,
            type='expense',
            amount=Decimal('85.50'),
            date=timezone.now().date(),
            description='Supermercado'
        )

        other_acc = Account.objects.create(user=other_user, name='Itaú', balance=Decimal('300.00'))

        self.client.force_authenticate(user=user)
        response = self.client.delete('/api/v1/auth/account/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        self.assertEqual(Account.objects.filter(user_id=user.pk).count(), 0)
        self.assertEqual(Category.objects.filter(user_id=user.pk).count(), 0)
        self.assertEqual(Transaction.objects.filter(user_id=user.pk).count(), 0)
        self.assertEqual(Budget.objects.filter(user_id=user.pk).count(), 0)

        # Garante que dados de outros usuários permanecem intactos
        self.assertTrue(User.objects.filter(pk=other_user.pk).exists())
        self.assertTrue(Account.objects.filter(pk=other_acc.pk).exists())

    def test_upgrade_plan_endpoint(self):
        user = User.objects.create_user(
            username='upgrade_user',
            email='upgrade@example.com',
            password='MyPassword123!'
        )
        self.assertFalse(user.profile.is_pro)
        self.client.force_authenticate(user=user)

        response = self.client.post(
            '/accounts/api/v1/auth/subscription/upgrade/',
            {'period': 'yearly'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.profile.refresh_from_db()
        self.assertTrue(user.profile.is_pro)
        self.assertEqual(user.profile.plan, 'pro')
        self.assertIsNotNone(user.profile.plan_expires_at)


