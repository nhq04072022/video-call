import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { SessionCreationRequest, EmergencyContact } from '../../../types/session';

interface SessionFormProps {
  onSubmit: (data: SessionCreationRequest) => void;
  isLoading?: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<SessionCreationRequest>({
    booking_id: '',
    session_config: {
      mentor_id: '',
      patient_id: '',
      planned_duration: 60,
      session_type: 'standard',
    },
    recording_preferences: {
      recording_enabled: false,
    },
    emergency_contacts: [],
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: '',
    phone: '',
    relation: '',
  });

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => {
        if (parent === 'session_config') {
          return {
            ...prev,
            session_config: {
              ...(prev.session_config || {}),
              [child]: value,
            },
          };
        } else if (parent === 'recording_preferences') {
          return {
            ...prev,
            recording_preferences: {
              ...(prev.recording_preferences || {}),
              [child]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAddEmergencyContact = () => {
    if (emergencyContact.name && emergencyContact.phone) {
      setFormData((prev) => ({
        ...prev,
        emergency_contacts: [...(prev.emergency_contacts || []), { ...emergencyContact }],
      }));
      setEmergencyContact({ name: '', phone: '', relation: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          label="Booking ID"
          type="text"
          value={formData.booking_id}
          onChange={(e) => handleChange('booking_id', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Mentor ID"
          type="text"
          value={formData.session_config.mentor_id || ''}
          onChange={(e) => handleChange('session_config.mentor_id', e.target.value)}
        />
        <Input
          label="Patient ID"
          type="text"
          value={formData.session_config.patient_id || ''}
          onChange={(e) => handleChange('session_config.patient_id', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Planned Duration (minutes)"
          type="number"
          value={formData.session_config.planned_duration || 60}
          onChange={(e) => handleChange('session_config.planned_duration', parseInt(e.target.value))}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={formData.session_config.session_type || 'standard'}
            onChange={(e) => handleChange('session_config.session_type', e.target.value)}
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.recording_preferences.recording_enabled || false}
            onChange={(e) => handleChange('recording_preferences.recording_enabled', e.target.checked)}
            className="rounded h-5 w-5 min-h-[44px] min-w-[44px] p-2 focus:ring-2 focus:ring-primary-purple focus:ring-offset-2"
            aria-label="Enable recording for this session"
          />
          <span className="text-sm font-medium text-gray-700 min-h-[44px] flex items-center">Enable Recording</span>
        </label>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">Emergency Contacts</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input
            label="Name"
            type="text"
            value={emergencyContact.name}
            onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
          />
          <Input
            label="Phone"
            type="text"
            value={emergencyContact.phone}
            onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
          />
          <Input
            label="Relation"
            type="text"
            value={emergencyContact.relation}
            onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleAddEmergencyContact}>
          Add Emergency Contact
        </Button>
        {formData.emergency_contacts && formData.emergency_contacts.length > 0 && (
          <ul className="mt-4 space-y-2">
            {formData.emergency_contacts.map((contact, index) => (
              <li key={index} className="text-sm text-gray-600">
                {contact.name} - {contact.phone} ({contact.relation})
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
        {isLoading ? 'Starting...' : 'Start Session'}
      </Button>
    </form>
  );
};


