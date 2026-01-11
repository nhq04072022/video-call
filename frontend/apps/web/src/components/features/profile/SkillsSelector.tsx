/**
 * Skills Selector Component - Multi-select for mentor skills
 * WCAG 2.1 AA compliant
 */
import React, { useState, useEffect } from 'react';
import { mentorApi } from '../../../services/mentorApi';
import type { ExpertiseArea } from '../../../types/mentor';

interface SkillsSelectorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  error?: string;
}

export const SkillsSelector: React.FC<SkillsSelectorProps> = ({
  selectedSkills,
  onSkillsChange,
  error,
}) => {
  const [availableSkills, setAvailableSkills] = useState<ExpertiseArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadSkills = async () => {
      setLoading(true);
      try {
        const skills = await mentorApi.getExpertiseAreas();
        setAvailableSkills(skills);
      } catch (err: any) {
        console.error('Failed to load skills:', err);
        // Fallback to common skills if API fails
        setAvailableSkills([
          { expertise_id: 'career', name: 'Career Development' },
          { expertise_id: 'study', name: 'Study Skills' },
          { expertise_id: 'life', name: 'Life Coaching' },
          { expertise_id: 'tech', name: 'Technology' },
          { expertise_id: 'business', name: 'Business' },
          { expertise_id: 'health', name: 'Health & Wellness' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadSkills();
  }, []);

  const filteredSkills = availableSkills.filter(skill =>
    skill.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      onSkillsChange(selectedSkills.filter(id => id !== skillId));
    } else {
      onSkillsChange([...selectedSkills, skillId]);
    }
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="skills-search"
        className="block text-sm font-medium mb-2"
        style={{ color: '#514B50' }}
      >
        Skills & Expertise Areas
      </label>

      {/* Search Input */}
      <input
        id="skills-search"
        type="text"
        placeholder="Search skills..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 min-h-[44px]"
        style={{ '--tw-ring-color': '#A11692' } as React.CSSProperties}
        aria-label="Search skills"
      />

      {/* Skills Grid */}
      {loading ? (
        <div className="text-sm text-gray-500 py-4">Loading skills...</div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredSkills.map((skill) => {
              const isSelected = selectedSkills.includes(skill.expertise_id);
              return (
                <button
                  key={skill.expertise_id}
                  type="button"
                  onClick={() => toggleSkill(skill.expertise_id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${
                    isSelected
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={
                    isSelected
                      ? ({
                          background: 'linear-gradient(90deg, #A11692 0%, #A31694 100%)',
                          '--tw-ring-color': '#A11692',
                        } as React.CSSProperties)
                      : ({ '--tw-ring-color': '#A11692' } as React.CSSProperties)
                  }
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? 'Remove' : 'Add'} ${skill.name} skill`}
                >
                  <div className="flex items-center justify-between">
                    <span>{skill.name}</span>
                    {isSelected && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {filteredSkills.length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">No skills found</p>
          )}
        </div>
      )}

      {/* Selected Skills Display */}
      {selectedSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Selected ({selectedSkills.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skillId) => {
              const skill = availableSkills.find(s => s.expertise_id === skillId);
              return (
                <span
                  key={skillId}
                  className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  style={{ backgroundColor: '#A11692' + '15', color: '#A11692' }}
                >
                  {skill?.name || skillId}
                  <button
                    type="button"
                    onClick={() => toggleSkill(skillId)}
                    className="hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded"
                    aria-label={`Remove ${skill?.name || skillId}`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
