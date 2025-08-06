
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, User, Calendar, Building2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  type: 'karyakar' | 'task' | 'mandir' | 'kshetra' | 'village' | 'mandal';
  id: string;
  title: string;
  subtitle: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface GlobalSearchProps {
  className?: string;
}

export const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && searchTerm.length >= 2) {
        performGlobalSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const performGlobalSearch = async (term: string) => {
    setIsSearching(true);
    try {
      const results: SearchResult[] = [];

      // Search in profiles (karyakars)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, mobile_number, role, notes')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,mobile_number.ilike.%${term}%,notes.ilike.%${term}%`)
        .limit(5);

      if (profiles) {
        profiles.forEach(profile => {
          results.push({
            type: 'karyakar',
            id: profile.id,
            title: profile.full_name,
            subtitle: `${profile.email || 'No email'} • ${profile.role}`,
            url: '/karyakars',
            icon: User
          });
        });
      }

      // Search in tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description, status')
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(5);

      if (tasks) {
        tasks.forEach(task => {
          results.push({
            type: 'task',
            id: task.id,
            title: task.title,
            subtitle: `${task.description?.substring(0, 50)}... • ${task.status}`,
            url: '/tasks',
            icon: Calendar
          });
        });
      }

      // Search in mandirs
      const { data: mandirs } = await supabase
        .from('mandirs')
        .select('id, name, address')
        .ilike('name', `%${term}%`)
        .limit(3);

      if (mandirs) {
        mandirs.forEach(mandir => {
          results.push({
            type: 'mandir',
            id: mandir.id,
            title: mandir.name,
            subtitle: mandir.address || 'No address',
            url: '/admin',
            icon: Building2
          });
        });
      }

      // Search in kshetras, villages, mandals
      const [kshetrasRes, villagesRes, mandalsRes] = await Promise.all([
        supabase.from('kshetras').select('id, name, description').ilike('name', `%${term}%`).limit(3),
        supabase.from('villages').select('id, name, district').ilike('name', `%${term}%`).limit(3),
        supabase.from('mandals').select('id, name, description').ilike('name', `%${term}%`).limit(3)
      ]);

      if (kshetrasRes.data) {
        kshetrasRes.data.forEach(kshetra => {
          results.push({
            type: 'kshetra',
            id: kshetra.id,
            title: kshetra.name,
            subtitle: kshetra.description || 'Kshetra',
            url: '/admin',
            icon: MapPin
          });
        });
      }

      if (villagesRes.data) {
        villagesRes.data.forEach(village => {
          results.push({
            type: 'village',
            id: village.id,
            title: village.name,
            subtitle: village.district || 'Village',
            url: '/admin',
            icon: MapPin
          });
        });
      }

      if (mandalsRes.data) {
        mandalsRes.data.forEach(mandal => {
          results.push({
            type: 'mandal',
            id: mandal.id,
            title: mandal.name,
            subtitle: mandal.description || 'Mandal',
            url: '/admin',
            icon: MapPin
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Global search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4"
          onBlur={(e) => {
            // Delay clearing to allow click on results
            setTimeout(() => {
              if (!e.currentTarget.contains(document.activeElement)) {
                clearSearch();
              }
            }, 200);
          }}
        />
      </div>

      {(searchResults.length > 0 || isSearching) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto z-50">
          {isSearching && (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              Searching...
            </div>
          )}
          
          {searchResults.map((result, index) => {
            const IconComponent = result.icon;
            return (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize flex-shrink-0">
                        {result.type}
                      </span>
                      <div className="font-medium text-sm truncate">{result.title}</div>
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1">{result.subtitle}</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {!isSearching && searchResults.length === 0 && searchTerm && (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
