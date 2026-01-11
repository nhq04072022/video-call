/**
 * Mentor Search Page
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMentors } from '../hooks/useMentors';
import { MentorCard } from '../components/features/mentors/MentorCard';
import { MentorFilters } from '../components/features/mentors/MentorFilters';
import { Button } from '../components/ui/Button';
import type { MentorSearchFilters } from '../types/mentor';

export const MentorSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get initial filters from URL params
  const initialFilters: MentorSearchFilters = {
    expertise_ids: searchParams.get('expertise')?.split(',').filter(Boolean),
    min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
    min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
    is_available: searchParams.get('available') === 'true' ? true : undefined,
    limit: 20,
    offset: 0,
  };

  const {
    mentors,
    loading,
    error,
    total,
    filters,
    searchMentors,
    updateFilters,
    loadMore,
    hasMore,
  } = useMentors(initialFilters);

  const handleFiltersChange = (newFilters: Partial<MentorSearchFilters>) => {
    updateFilters(newFilters);
  };

  const handleSearch = () => {
    searchMentors();
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p>Error loading mentors: {error}</p>
          <Button onClick={() => searchMentors()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-grey mb-2">Find a Mentor</h1>
        <p className="text-text-grey/70">
          Connect with experienced mentors for personalized guidance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <MentorFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Mentor List */}
        <div className="lg:col-span-3">
          {loading && mentors.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
              <p className="mt-4 text-text-grey/70">Loading mentors...</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-text-grey/70">No mentors found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-text-grey/70">
                Found {total} mentor{total !== 1 ? 's' : ''}
              </div>
              <div className="space-y-4">
                {mentors.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <Button onClick={loadMore} variant="outline" disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

