import { useState, useEffect } from 'react';
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import AgentLogin from './pages/AgentLogin';
import AgentSignup from './pages/AgentSignup';
import AgentDashboard from './pages/AgentDashboard';
import AgentWallet from './pages/AgentWallet';
import UserDashboard from './pages/UserDashboard';
import UserOrders from './pages/UserOrders';
import WalletHistory from './pages/WalletHistory';
import OrderDetails from './pages/OrderDetails';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrderManagement from './pages/AdminOrderManagement';
import AdminOrderCreate from './pages/AdminOrderCreate';
import AdminCommonOrderCreate from './pages/AdminCommonOrderCreate';
import PaymentScreenshotPage from './pages/PaymentScreenshotPage';
import AddCallNumber from './pages/AddCallNumber'; // ✅ ADD
import AddCustomer from './pages/AddCustomerNumber';

type View =
  | 'user-login'
  | 'user-signup'
  | 'user-dashboard'
  | 'user-orders'
  | 'user-wallet'
  | 'user-order-details'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-orders'
  | 'admin-create-order'
  | 'admin-common-order'
  | 'admin-order-details'
  | 'admin-payment-screenshot'
  | 'admin-add-call-number'   // ✅ ADD
  | 'agent-login'
  | 'agent-signup'
  | 'agent-dashboard'
  | 'agent-wallet'
  | 'customer-calls';

function App() {
  const [currentView, setCurrentView] = useState<View>('user-login');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('gotruck_user');
    const savedAdmin = localStorage.getItem('gotruck_admin');
    const savedAgent = localStorage.getItem('bhadra_agent');

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('user-dashboard');
    } else if (savedAdmin) {
      setCurrentAdmin(JSON.parse(savedAdmin));
      setCurrentView('admin-dashboard');
    } else if (savedAgent) {
      setCurrentAgent(JSON.parse(savedAgent));
      setCurrentView('agent-dashboard');
    } else {
      const path = window.location.pathname;
      if (path.endsWith('/admin')) setCurrentView('admin-login');
      else if (path.endsWith('/agent-signup')) setCurrentView('agent-signup');
      else if (path.endsWith('/agent')) setCurrentView('agent-login');
      else setCurrentView('user-login');
    }
  }, []);

  const handleUserLogin = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('gotruck_user', JSON.stringify(user));
    setCurrentView('user-dashboard');
  };

  const handleAdminLogin = (admin: any) => {
    setCurrentAdmin(admin);
    localStorage.setItem('gotruck_admin', JSON.stringify(admin));
    setCurrentView('admin-dashboard');
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gotruck_user');
    setCurrentView('user-login');
  };

  const handleAdminLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('gotruck_admin');
    setCurrentView('admin-login');
  };

  // ---------------- USER ----------------

  if (currentView === 'user-login') {
    return (
      <UserLogin
        onLogin={handleUserLogin}
        onNavigateToSignup={() => setCurrentView('user-signup')}
      />
    );
  }

  if (currentView === 'user-signup') {
    return (
      <UserSignup
        onSignupSuccess={() => setCurrentView('user-login')}
        onNavigateToLogin={() => setCurrentView('user-login')}
      />
    );
  }

  if (currentView === 'user-dashboard' && currentUser) {
    return (
      <UserDashboard
        user={currentUser}
        onLogout={handleUserLogout}
        onNavigateToOrders={() => setCurrentView('user-orders')}
        onNavigateToWallet={() => setCurrentView('user-wallet')}
      />
    );
  }

  if (currentView === 'user-orders' && currentUser) {
    return (
      <UserOrders
        user={currentUser}
        onBack={() => setCurrentView('user-dashboard')}
        onViewOrder={(id) => {
          setSelectedOrderId(id);
          setCurrentView('user-order-details');
        }}
      />
    );
  }

  if (currentView === 'user-order-details' && selectedOrderId) {
    return (
      <OrderDetails
        orderId={selectedOrderId}
        isAdmin={false}
        onBack={() => setCurrentView('user-orders')}
      />
    );
  }

  if (currentView === 'user-wallet' && currentUser) {
    return (
      <WalletHistory
        user={currentUser}
        onBack={() => setCurrentView('user-dashboard')}
      />
    );
  }

  // ---------------- AGENT ----------------

  if (currentView === 'agent-login') {
    return (
      <AgentLogin
        onNavigateToSignup={() => setCurrentView('agent-signup')}
        onLogin={(agent) => {
          setCurrentAgent(agent);
          localStorage.setItem('bhadra_agent', JSON.stringify(agent));
          setCurrentView('agent-dashboard');
        }}
      />
    );
  }

  if (currentView === 'agent-dashboard' && currentAgent) {
    return (
      <AgentDashboard
        agent={currentAgent}
        onLogout={() => {
          setCurrentAgent(null);
          localStorage.removeItem('bhadra_agent');
          setCurrentView('agent-login');
        }}
        onNavigateToWallet={() => setCurrentView('agent-wallet')}
      />
    );
  }

  if (currentView === 'agent-wallet' && currentAgent) {
    return (
      <AgentWallet
        agent={currentAgent}
        onBack={() => setCurrentView('agent-dashboard')}
      />
    );
  }

  if (currentView === 'agent-signup') {
    return (
      <AgentSignup
        onSignupSuccess={() => setCurrentView('agent-login')}
        onNavigateToLogin={() => setCurrentView('agent-login')}
      />
    );
  }

  // ---------------- ADMIN ----------------

  if (currentView === 'admin-login') {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  if (currentView === 'admin-dashboard' && currentAdmin) {
    return (
      <AdminDashboard
        _admin={currentAdmin}
        onLogout={handleAdminLogout}
        onNavigateToCreateOrder={() => setCurrentView('admin-create-order')}
        onNavigateToOrderManagement={() => setCurrentView('admin-orders')}
        onNavigateToCommonOrderCreate={() => setCurrentView('admin-common-order')}
        onNavigateToPaymentScreenshotPage={() =>
          setCurrentView('admin-payment-screenshot')
        }
        onNavigateToAddCallNumber={() =>
          setCurrentView('admin-add-call-number')
        }
        onNavigateToAddCustomerNumber={
          ()=> setCurrentView('customer-calls')
        }
      />
    );
  }

  if (currentView === 'admin-add-call-number' && currentAdmin) {
    return (
      <AddCallNumber
        onBack={() => setCurrentView('admin-dashboard')}
      />
    );
  }

  if (currentView === 'admin-payment-screenshot' && currentAdmin) {
    return (
      <PaymentScreenshotPage
        onBack={() => setCurrentView('admin-dashboard')}
      />
    );
  }

  if (currentView === 'admin-orders' && currentAdmin) {
    return (
      <AdminOrderManagement
        admin={currentAdmin}
        onBack={() => setCurrentView('admin-dashboard')}
        onViewOrder={(id) => {
          setSelectedOrderId(id.toString());
          setCurrentView('admin-order-details');
        }}
      />
    );
  }

  if (currentView === 'admin-order-details' && selectedOrderId) {
    return (
      <OrderDetails
        orderId={selectedOrderId}
        isAdmin={true}
        onBack={() => setCurrentView('admin-orders')}
      />
    );
  }

  if (currentView === 'admin-create-order' && currentAdmin) {
    return (
      <AdminOrderCreate
        admin={currentAdmin}
        onBack={() => setCurrentView('admin-dashboard')}
        onSuccess={() => setCurrentView('admin-orders')}
      />
    );
  }

  if (currentView === 'admin-common-order' && currentAdmin) {
    return (
      <AdminCommonOrderCreate
        admin={currentAdmin}
        onBack={() => setCurrentView('admin-dashboard')}
      />
    );
  }
  if (currentView === 'customer-calls' && currentAdmin) {
    return (
      <AddCustomer
        // admin={currentAdmin}
        onBack={() => setCurrentView('admin-dashboard')}
      />
    );
  }

  return null;
}

export default App;