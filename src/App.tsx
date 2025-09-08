import React, { useState } from 'react';
import { Car, Users, MapPin, Clock, Star, Menu, X,  Search,  } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useRides } from './hooks/useRides';
import { Ride } from './lib/supabase';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'create' | 'profile'>('home');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const { user, profile, loading: authLoadingState, signUp, signIn, signOut } = useAuth();
  const { rides, loading: ridesLoading, createRide, searchRides, requestRide } = useRides();

  const handleAuth = async (mode: 'login' | 'register') => {
    setAuthLoading(true);
    setEmailError('');

    try {
      if (mode === 'register') {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      setShowAuthModal(false);
      setCurrentView('browse');
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setEmailError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentView('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = async () => {
    await searchRides({
      from: searchFrom,
      to: searchTo,
      date: searchDate,
    });
  };

  const handleRequestRide = async (rideId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      await requestRide(rideId);
      alert('Ride request sent successfully!');
    } catch (error: any) {
      alert('Error sending ride request: ' + error.message);
    }
  };

  const RideCard = ({ ride }: { ride: Ride }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img 
            src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop" 
            alt={ride.driver?.full_name || 'Driver'}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{ride.driver?.full_name || 'Driver'}</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{ride.driver?.rating || 5.0}</span>
              <span className="text-sm text-gray-500">• {ride.driver?.university || 'Iqra University'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">Rs.{ride.price_per_person}</div>
          <div className="text-sm text-gray-500">per person</div>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600">From: {ride.from_location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-sm text-gray-600">To: {ride.to_location}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">{ride.departure_date} at {ride.departure_time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">{ride.available_seats}/{ride.total_seats} seats</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {ride.preferences.map((pref, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {pref}
          </span>
        ))}
      </div>
      
      <button 
        onClick={() => handleRequestRide(ride.id)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
      >
        Request to Join
      </button>
    </div>
  );

  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {authMode === 'login' ? 'Sign In to Iqra Carpool' : 'Join Iqra Carpool'}
          </h2>
          <button 
            onClick={() => setShowAuthModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Iqra University Students Only</strong><br />
            Please use your official Iqra University email address to access the carpool platform.
          </p>
        </div>
        
        <form className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Iqra University Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="your.name@iqra.edu.pk"
              required
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use your official Iqra University email (@iqra.edu.pk or @student.iqra.edu.pk)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="button"
            onClick={() => handleAuth(authMode)}
            disabled={authLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
          >
            {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );

  const CreateRideForm = () => {
    const [formData, setFormData] = useState({
      from_location: '',
      to_location: '',
      departure_date: '',
      departure_time: '',
      available_seats: 1,
      total_seats: 1,
      price_per_person: 0,
      additional_notes: '',
      preferences: [] as string[],
    });
    const [createLoading, setCreateLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      setCreateLoading(true);
      try {
        await createRide({
          ...formData,
          total_seats: formData.available_seats, // For simplicity, total_seats = available_seats
        });
        alert('Ride created successfully!');
        setCurrentView('browse');
        // Reset form
        setFormData({
          from_location: '',
          to_location: '',
          departure_date: '',
          departure_time: '',
          available_seats: 1,
          total_seats: 1,
          price_per_person: 0,
          additional_notes: '',
          preferences: [],
        });
      } catch (error: any) {
        alert('Error creating ride: ' + error.message);
      } finally {
        setCreateLoading(false);
      }
    };

    const handlePreferenceChange = (pref: string, checked: boolean) => {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          preferences: [...prev.preferences, pref]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          preferences: prev.preferences.filter(p => p !== pref)
        }));
      }
    };

    return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Offer a Ride</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input 
                type="text" 
                value={formData.from_location}
                onChange={(e) => setFormData(prev => ({ ...prev, from_location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Starting location"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input 
                type="text" 
                value={formData.to_location}
                onChange={(e) => setFormData(prev => ({ ...prev, to_location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Destination"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input 
                type="date" 
                value={formData.departure_date}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input 
                type="time" 
                value={formData.departure_time}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Seats</label>
              <select 
                value={formData.available_seats}
                onChange={(e) => setFormData(prev => ({ ...prev, available_seats: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="1">1 seat</option>
                <option value="2">2 seats</option>
                <option value="3">3 seats</option>
                <option value="4">4 seats</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price per Person (Rs.)</label>
              <input 
                type="number" 
                value={formData.price_per_person}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_person: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea 
              rows={3}
              value={formData.additional_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Any additional information for passengers..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferences</label>
            <div className="grid grid-cols-2 gap-3">
              {["No Smoking", "Music OK", "Quiet Ride", "Pets OK", "Conversation Welcome", "No Pets"].map((pref) => (
                <label key={pref} className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.preferences.includes(pref)}
                    onChange={(e) => handlePreferenceChange(pref, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-gray-600">{pref}</span>
                </label>
              ))}
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={createLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium"
          >
            {createLoading ? 'Creating Ride...' : 'Post Ride'}
          </button>
        </form>
      </div>
    </div>
    );
  };

  const BrowseRides = () => (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Find a Ride</h1>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input 
                type="text" 
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Starting location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input 
                type="text" 
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Destination"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
  onClick={handleSearch}
>
  <Search className="w-4 h-4" />
  <span>Search</span>
</button>
            </div>
          </div>
        </div>
      </div>
      
      {ridesLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading rides...</div>
        </div>
      ) : rides.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-600">No rides found. Try adjusting your search criteria.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map(ride => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );

  const HomePage = () => (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Iqra University Carpool</h1>
          <p className="text-xl mb-8 text-blue-100">Safe, affordable ridesharing exclusively for Iqra University students</p>
          
          <div className="bg-white rounded-xl p-6 shadow-xl text-gray-900 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input 
                  type="text" 
                  placeholder="From"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="To"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={() => setCurrentView('browse')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                Find Rides
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose Iqra University Carpool?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Iqra Community Only</h3>
              <p className="text-gray-600">Connect exclusively with verified Iqra University students using official email verification</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & Reliable</h3>
              <p className="text-gray-600">Iqra University email verification and user ratings ensure safe travels within our community</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cost Effective</h3>
              <p className="text-gray-600">Share fuel costs and save money on transportation</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Ready to Start Carpooling?</h2>
          <p className="text-xl text-gray-600 mb-8">Join your fellow Iqra University students in saving money and making new connections</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setCurrentView('browse')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg transition-colors duration-200 font-medium"
            >
              Find a Ride
            </button>
            <button 
              onClick={() => setCurrentView('create')}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg transition-colors duration-200 font-medium"
            >
              Offer a Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (authLoadingState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => setCurrentView('home')}
            >
              <Car className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Iqra Carpool</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setCurrentView('home')}
                className={`text-sm font-medium transition-colors duration-200 ${currentView === 'home' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentView('browse')}
                className={`text-sm font-medium transition-colors duration-200 ${currentView === 'browse' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
              >
                Find Rides
              </button>
              <button 
                onClick={() => setCurrentView('create')}
                className={`text-sm font-medium transition-colors duration-200 ${currentView === 'create' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
              >
                Offer Ride
              </button>
              
              {user && profile ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Welcome, {profile.full_name}</span>
                  <button 
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }}
                  className="text-left px-2 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Home
                </button>
                <button 
                  onClick={() => { setCurrentView('browse'); setIsMenuOpen(false); }}
                  className="text-left px-2 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Find Rides
                </button>
                <button 
                  onClick={() => { setCurrentView('create'); setIsMenuOpen(false); }}
                  className="text-left px-2 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Offer Ride
                </button>
                
                {!user && (
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <button 
                      onClick={() => { setAuthMode('login'); setShowAuthModal(true); setIsMenuOpen(false); }}
                      className="block px-2 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => { setAuthMode('register'); setShowAuthModal(true); setIsMenuOpen(false); }}
                      className="block px-2 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg mt-2 transition-colors duration-200"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className={currentView === 'home' ? '' : 'py-8'}>
        <div className={currentView === 'home' ? '' : 'max-w-6xl mx-auto px-4'}>
          {currentView === 'home' && <HomePage />}
          {currentView === 'browse' && <BrowseRides />}
          {currentView === 'create' && <CreateRideForm />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Car className="w-6 h-6" />
                <span className="text-lg font-bold">Iqra University Carpool</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting Iqra University students for safe, affordable, and eco-friendly transportation.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-4">For Students</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Find Rides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Offer Rides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Report Issue</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 University Carpool. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal />}
    </div>
  );
}

export default App;