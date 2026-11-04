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

    def test_password_reset_flow_and_invalid_token(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        user = User.objects.create_user(
            username='reset_user',
            email='reset@example.com',
            password='OldPassword123!'
        )

        # 1. Solicita recuperação por e-mail
        req_res = self.client.post(
            '/accounts/api/v1/auth/password-reset/',
            {'email': 'reset@example.com'},
            format='json'
        )
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # 2. Tenta confirmar com token inválido
        bad_res = self.client.post(
            '/accounts/api/v1/auth/password-reset/confirm/',
            {
                'uid': uid,
                'token': 'invalid-token-123',
                'new_password': 'NewStrongPassword456!'
            },
            format='json'
        )
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Confirma com UID e Token válidos
        ok_res = self.client.post(
            '/accounts/api/v1/auth/password-reset/confirm/',
            {
                'uid': uid,
                'token': token,
                'new_password': 'NewStrongPassword456!'
            },
            format='json'
        )
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewStrongPassword456!'))

    def test_password_change_authenticated(self):
        user = User.objects.create_user(
            username='change_pwd_user',
            email='changepwd@example.com',
            password='CurrentPassword123!'
        )
        self.client.force_authenticate(user=user)

        # Senha atual incorreta deve falhar com 400
        wrong_res = self.client.post(
            '/accounts/api/v1/auth/password-change/',
            {
                'old_password': 'WrongPassword000!',
                'new_password': 'UpdatedPassword789!'
            },
            format='json'
        )
        self.assertEqual(wrong_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Senha atual correta deve atualizar a senha com 200
        ok_res = self.client.post(
            '/accounts/api/v1/auth/password-change/',
            {
                'old_password': 'CurrentPassword123!',
                'new_password': 'UpdatedPassword789!'
            },
            format='json'
        )
        self.assertEqual(ok_res.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('UpdatedPassword789!'))



