/**
 * Mentor Filters Component
 */
import React, { useState, useEffect } from 'react';
import type { MentorSearchFilters } from '../../../types/mentor';
import type { ExpertiseArea } from '../../../types/mentor';
import { mentorApi } from '../../../services/mentorApi';
import { Button } from '../../ui/Button';

interface MentorFiltersProps {
  filters: MentorSearchFilters;
  onFiltersChange: (filters: Partial<MentorSearchFilters>) => void;
  onSearch: () => void;
}

export const MentorFilters: React.FC<MentorFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
}) => {
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseArea[]>([]);
  const [loadingExpertise, setLoadingExpertise] = useState(false);

  useEffect(() => {
    const loadExpertise = async () => {
      setLoadingExpertise(true);
      try {
        const areas = await mentorApi.getExpertiseAreas();
        setExpertiseAreas(areas);
      } catch (error) {
        console.error('Failed to load expertise areas:', error);
      } finally {
        setLoadingExpertise(false);
      }
    };
    loadExpertise();
  }, []);

  const handleExpertiseToggle = (expertiseId: string) => {
    const currentIds = filters.expertise_ids || [];
    const newIds = currentIds.includes(expertiseId)
      ? currentIds.filter(id => id !== expertiseId)
      : [...currentIds, expertiseId];
    onFiltersChange({ expertise_ids: newIds });
  };

  const handleReset = () => {
    onFiltersChange({
      expertise_ids: [],
      min_price: undefined,
      max_price: undefined,
      min_rating: undefined,
      is_available: undefined,
      offset: 0,
    });
  };

  return (
    <aside className="bg-white rounded-2xl shadow-sm p-6" aria-label="Mentor filters">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-grey mb-4">Filters</h2>
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full"
          aria-label="Reset all filters"
        >
          Reset Filters
        </Button>
      </div>

      {/* Expertise Areas */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-grey mb-3">Expertise Areas</h3>
        {loadingExpertise ? (
          <div className="text-sm text-text-grey/60">Loading...</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expertiseAreas.map(area => (
              <label
                key={area.expertise_id}
                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={filters.expertise_ids?.includes(area.expertise_id) || false}
                  onChange={() => handleExpertiseToggle(area.expertise_id)}
                  className="w-4 h-4 text-primary-purple border-gray-300 rounded focus:ring-primary-purple"
                  aria-label={`Filter by ${area.name}`}
                />
                <span className="text-sm text-text-grey">{area.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-grey mb-3">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="min-price" className="block text-xs text-text-grey/70 mb-1">
              Min Price ($/hr)
            </label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="1"
              value={filters.min_price || ''}
              onChange={(e) =>
                onFiltersChange({ min_price: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="block text-xs text-text-grey/70 mb-1">
              Max Price ($/hr)
            </label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="1"
              value={filters.max_price || ''}
              onChange={(e) =>
                onFiltersChange({ max_price: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-grey mb-3">Minimum Rating</h3>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={filters.min_rating || 0}
          onChange={(e) => onFiltersChange({ min_rating: parseFloat(e.target.value) })}
          className="w-full"
          aria-label="Minimum rating filter"
        />
        <div className="flex justify-between text-xs text-text-grey/70 mt-1">
          <span>0</span>
          <span>{filters.min_rating?.toFixed(1) || '0'}</span>
          <span>5</span>
        </div>
      </div>

      {/* Availability */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.is_available || false}
            onChange={(e) => onFiltersChange({ is_available: e.target.checked || undefined })}
            className="w-4 h-4 text-primary-purple border-gray-300 rounded focus:ring-primary-purple"
          />
          <span className="text-sm text-text-grey">Available now</span>
        </label>
      </div>

      <Button
        onClick={onSearch}
        className="w-full"
        aria-label="Apply filters"
      >
        Apply Filters
      </Button>
    </aside>
  );
};

