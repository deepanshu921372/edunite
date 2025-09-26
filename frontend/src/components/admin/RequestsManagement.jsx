import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import { showToast } from '../../utils/toast';

const RequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    // Only fetch requests if not already loaded
    if (!requestsLoaded) {
      fetchRequests();
    }
  }, [requestsLoaded]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showNotesModal) {
        setShowNotesModal(false);
      }
    };

    if (showNotesModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [showNotesModal]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, filterStatus]);

  const fetchRequests = async () => {
    // Prevent duplicate calls if already loading or loaded
    if (loading && requestsLoaded) return;

    setLoading(true);
    try {
      const response = await adminAPI.getUserRequests(filterStatus);
      setRequests(response.requests || []);
      setStats(response.stats || { pending: 0, approved: 0, rejected: 0, blocked: 0 });
      setRequestsLoaded(true);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('Failed to load user requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.userId?.name && request.userId.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus);
    }

    setFilteredRequests(filtered);
  };

  const handleApproveUser = async (requestId, role, adminNotes = '') => {
    setProcessingId(requestId);
    try {
      await adminAPI.approveUser(requestId, role, adminNotes);
      showToast(`User approved as ${role}`, 'success');
      setRequestsLoaded(false); // Trigger refetch
    } catch (error) {
      console.error('Error approving user:', error);
      showToast('Failed to approve user', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectUser = async (requestId, adminNotes = '') => {
    if (!window.confirm('Are you sure you want to reject this user?')) {
      return;
    }

    setProcessingId(requestId);
    try {
      await adminAPI.rejectUser(requestId, adminNotes);
      showToast('User request rejected', 'success');
      setRequestsLoaded(false); // Trigger refetch
    } catch (error) {
      console.error('Error rejecting user:', error);
      showToast('Failed to reject user', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlockUser = async (requestId, adminNotes = '') => {
    if (!window.confirm('Are you sure you want to block this user? This action will prevent them from signing in.')) {
      return;
    }

    setProcessingId(requestId);
    try {
      await adminAPI.blockUser(requestId, adminNotes);
      showToast('User blocked successfully', 'success');
      setRequestsLoaded(false); // Trigger refetch
    } catch (error) {
      console.error('Error blocking user:', error);
      showToast('Failed to block user', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const openNotesModal = (request, action, role = '') => {
    setSelectedRequest(request);
    setActionType(action);
    setSelectedRole(role);
    setAdminNotes('');
    setShowNotesModal(true);
  };

  const handleModalSubmit = async () => {
    if (!selectedRequest || !actionType) return;

    setShowNotesModal(false);

    switch (actionType) {
      case 'approve':
        await handleApproveUser(selectedRequest._id, selectedRole, adminNotes);
        break;
      case 'reject':
        await handleRejectUser(selectedRequest._id, adminNotes);
        break;
      case 'block':
        await handleBlockUser(selectedRequest._id, adminNotes);
        break;
      default:
        break;
    }

    setSelectedRequest(null);
    setActionType('');
    setSelectedRole('');
    setAdminNotes('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 shadow-sm';
      case 'approved':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm';
      case 'rejected':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 shadow-sm';
      case 'blocked':
        return 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading user requests..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Requests</h2>
          <p className="mt-2 text-gray-600">
            Review and approve new user registrations.
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border cursor-pointer border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100"
      >
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'All user requests have been processed.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredRequests.map((request, index) => (
                  <motion.tr
                    key={request._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                            <span className="text-white text-sm font-medium">
                              {request.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                            {request.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {request._id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize shadow-sm">
                        {request.requestedRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <select
                            id={`role-${request._id}`}
                            defaultValue={request.requestedRole}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                          </select>
                          <button
                            onClick={() => {
                              const roleSelect = document.getElementById(`role-${request._id}`);
                              const role = roleSelect.value;
                              if (role) {
                                openNotesModal(request, 'approve', role);
                              } else {
                                showToast('Please select a role', 'error');
                              }
                            }}
                            disabled={processingId === request._id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {processingId === request._id ? (
                              <LoadingSpinner size="sm" message="" />
                            ) : (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openNotesModal(request, 'reject')}
                            disabled={processingId === request._id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </button>
                          <button
                            onClick={() => openNotesModal(request, 'block')}
                            disabled={processingId === request._id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Block
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <div className="text-gray-500 text-sm">
                          <div className="capitalize font-medium">{request.status}</div>
                          {request.processedAt && (
                            <div className="text-xs text-gray-400">
                              {new Date(request.processedAt).toLocaleDateString()}
                            </div>
                          )}
                          {request.processedBy && (
                            <div className="text-xs text-gray-400">
                              by {request.processedBy.name}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Admin Notes Modal */}
      {showNotesModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white bg-opacity-20 backdrop-blur-[2px] overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          onClick={() => setShowNotesModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b border-gray-100 ${
              actionType === 'approve'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                : actionType === 'reject'
                ? 'bg-gradient-to-r from-red-50 to-pink-50'
                : 'bg-gradient-to-r from-gray-50 to-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    actionType === 'approve'
                      ? 'bg-green-100 text-green-600'
                      : actionType === 'reject'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {actionType === 'approve' ? (
                      <Check className="w-5 h-5" />
                    ) : actionType === 'reject' ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {actionType === 'approve' ? 'Approve User Request' : actionType === 'reject' ? 'Reject User Request' : 'Block User Account'}
                    </h3>
                    {selectedRequest && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedRequest.name} • {selectedRequest.email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="p-2 cursor-pointer hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {actionType === 'approve'
                    ? 'Add approval notes (optional)'
                    : actionType === 'reject'
                    ? 'Reason for rejection (optional)'
                    : 'Reason for blocking (optional)'}
                </label>
                <div className="relative">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      actionType === 'approve'
                        ? 'e.g., Welcome to Edunite! Looking forward to having you on board.'
                        : actionType === 'reject'
                        ? 'e.g., Please provide more information about your background or affiliation.'
                        : 'e.g., Violation of terms of service or suspicious activity detected.'
                    }
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm placeholder-gray-400 transition-all duration-200"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {adminNotes.length}/500
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {actionType === 'approve'
                    ? 'This message will be included in the approval email.'
                    : actionType === 'reject'
                    ? 'This reason will be sent to the user via email.'
                    : 'This action will permanently prevent the user from accessing the system.'
                  }
                </p>
              </div>

              {/* Role display for approval */}
              {actionType === 'approve' && selectedRole && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      Approving as: <span className="capitalize font-semibold">{selectedRole}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-5 py-2.5 cursor-pointer border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className={`px-6 py-2.5 cursor-pointer border border-transparent rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                  actionType === 'approve'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-lg shadow-green-500/25'
                    : actionType === 'reject'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-lg shadow-red-500/25'
                    : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black focus:ring-gray-500 shadow-lg shadow-gray-500/25'
                }`}
              >
                {actionType === 'approve' ? (
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Approve User</span>
                  </div>
                ) : actionType === 'reject' ? (
                  <div className="flex items-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Reject User</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Block User</span>
                  </div>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-yellow-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <AlertTriangle className="w-7 h-7 text-amber-700" />
              </div>
              {stats.pending > 0 && (
                <div className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>New!</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-green-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <Check className="w-7 h-7 text-green-700" />
              </div>
              <div className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Approved</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-red-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <X className="w-7 h-7 text-red-700" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Rejected</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
          whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl shadow-gray-200 transition-all duration-300 cursor-pointer group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gray-50 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <Shield className="w-7 h-7 text-gray-700" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Blocked</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.blocked || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RequestsManagement;