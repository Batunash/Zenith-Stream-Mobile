import React from 'react';
import renderer, { act } from 'react-test-renderer';
import RegisterScreen from '../RegisterScreen';
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


describe('RegisterScreen', () => {
  const mockNavigate = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useNavigation.mockReturnValue({ navigate: mockNavigate });
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null
    });
  });

  it('renders correctly', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<RegisterScreen />);
    });
    const root = rootRenderer.root;

    expect(root.findAllByType('TextInput').length).toBe(2); // Email and Password
    const titleText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'auth.register_title'
    );
    expect(titleText.length).toBeGreaterThan(0);
  });

  it('handles signin button press', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<RegisterScreen />);
    });
    const root = rootRenderer.root;

    const signinBtn = root.findByProps({ testID: 'signin-btn' });
    
    act(() => {
      signinBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('shows error if fields are empty on register', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<RegisterScreen />);
    });
    const root = rootRenderer.root;

    const registerBtn = root.findByProps({ testID: 'register-btn' });
    
    act(() => {
      registerBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('common.error', 'auth.empty_fields_error');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register with email and password', async () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<RegisterScreen />);
    });
    const root = rootRenderer.root;

    const inputs = root.findAllByType('TextInput');
    act(() => {
      inputs[0].props.onChangeText('test@test.com');
      inputs[1].props.onChangeText('password123');
    });

    const registerBtn = root.findByProps({ testID: 'register-btn' });
    
    await act(async () => {
      await registerBtn.props.onPress();
    });

    expect(mockRegister).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('toggles password visibility', () => {
    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<RegisterScreen />);
    });
    const root = rootRenderer.root;

    const inputs = root.findAllByType('TextInput');
    expect(inputs[1].props.secureTextEntry).toBe(true);

    const toggleBtn = root.findByProps({ testID: 'toggle-password-btn' });
    act(() => {
      toggleBtn.props.onPress();
    });

    expect(inputs[1].props.secureTextEntry).toBe(false);
  });

  it('shows error text if error is in store', () => {
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'Registration failed'
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<RegisterScreen />);
    });
    const root = rootRenderer.root;

    const errorText = root.findAll(node => 
      node.type === 'Text' && node.props.children === 'Registration failed'
    );
    expect(errorText.length).toBeGreaterThan(0);
  });

  it('shows loading indicator', () => {
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null
    });

    let rootRenderer;
    act(() => {
      rootRenderer = renderer.create(<RegisterScreen />);
    });
    const root = rootRenderer.root;

    expect(root.findAllByType('ActivityIndicator').length).toBeGreaterThan(0);
  });
});
