import React from 'react';
import renderer, { act } from 'react-test-renderer';
import LoginScreen from '../LoginScreen';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/useAuthStore';
import { Alert } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20 })
}));

jest.mock('../../../store/useAuthStore', () => ({
  useAuthStore: jest.fn()
}));


describe('LoginScreen', () => {
  const mockNavigate = jest.fn();
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useNavigation.mockReturnValue({ navigate: mockNavigate });
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null
    });
  });

  it('renders correctly', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<LoginScreen />);
    });
    const root = rootRenderer.root;

    expect(root.findAllByType('TextInput').length).toBe(2); // Email and Password
    const titleText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'auth.login_title'
    );
    expect(titleText.length).toBeGreaterThan(0);
  });

  it('handles signup button press', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<LoginScreen />);
    });
    const root = rootRenderer.root;

    const signupBtn = root.findByProps({ testID: 'signup-btn' });
    
    act(() => {
      signupBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('shows error if fields are empty on login', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<LoginScreen />);
    });
    const root = rootRenderer.root;

    const loginBtn = root.findByProps({ testID: 'login-btn' });
    
    act(() => {
      loginBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'auth.empty_fields_error');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with email and password', async () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<LoginScreen />);
    });
    const root = rootRenderer.root;

    const inputs = root.findAllByType('TextInput');
    act(() => {
      inputs[0].props.onChangeText('test@test.com');
      inputs[1].props.onChangeText('password123');
    });

    const loginBtn = root.findByProps({ testID: 'login-btn' });
    
    await act(async () => {
      await loginBtn.props.onPress();
    });

    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('toggles password visibility', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<LoginScreen />);
    });
    const root = rootRenderer.root;

    const inputs = root.findAllByType('TextInput');
    // initially secure
    expect(inputs[1].props.secureTextEntry).toBe(true);

    const toggleBtn = root.findByProps({ testID: 'toggle-password-btn' });
    act(() => {
      toggleBtn.props.onPress();
    });

    // should now be visible
    expect(inputs[1].props.secureTextEntry).toBe(false);
  });

  it('shows error text if error is in store', () => {
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials'
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<LoginScreen />);
    });
    const root = rootRenderer.root;

    const errorText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'auth.login_error'
    );
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('shows loading indicator', () => {
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<LoginScreen />);
    });
    const root = rootRenderer.root;

    expect(root.findAllByType('ActivityIndicator').length).toBeGreaterThan(0);
  });
});
