import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { logSearch, getDeviceId } from './firebase'; // Import the logging function

interface SearchResult {
  title?: string;
  snippet?: string;
  link: string;
  thumbnail?: string;
  image?: string;
  source?: string;
}

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialSearchType = (searchParams.get('searchType') as 'web' | 'image') || 'web';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchType, setSearchType] = useState<'web' | 'image'>(initialSearchType);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tabsVisible, setTabsVisible] = useState(initialQuery !== '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  
  const suggestionsRef = useRef<HTMLUListElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Initialize device ID on component mount
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    console.log('Device ID:', id);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create a helper function that accepts the query as a parameter
  const performSearchWithQuery = useCallback(async (searchQuery: string, page: number, isLoadMore = false) => {
    if (!searchQuery) return;

    // Prevent multiple simultaneous requests using state
    if (loading || loadingMore) {
      console.log('Already loading, skipping request');
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    setErrorMessage(null);

    try {
      const startIndex = (page - 1) * 10 + 1;
      
      // Update URL only for new searches, not for load more
      if (!isLoadMore) {
        setSearchParams({ query: searchQuery, searchType });
      }

      // Google Custom Search API limits to 100 total results
      // Last valid start index is 91 (results 91-100)
      if (startIndex > 91) {
        console.log('Reached API limit - no more results available');
        setHasMore(false);
        return;
      }

      console.log(`Fetching page ${page}, startIndex: ${startIndex}`);

      const response = await axios.get<{ items: any[] }>(
        `https://backend.carlo587-jcl.workers.dev/search`,
        {
          params: {
            query: searchQuery,
            searchType: searchType,
            start: startIndex,
          },
        }
      );

      const originalResults = response.data.items || [];
      console.log(`Received ${originalResults.length} results for page ${page}`);

      // If we get no results, we've reached the end
      if (originalResults.length === 0) {
        console.log('No results returned - reached end');
        setHasMore(false);
        return;
      }
      
      // Calculate total results after this page
      const totalResultsAfterThisPage = (page - 1) * 10 + originalResults.length;
      
      // Determine if there are more results
      let hasMoreResults = true;
      
      if (totalResultsAfterThisPage >= 100) {
        // Reached Google's 100 result limit
        console.log('Reached 100 result limit');
        hasMoreResults = false;
      } else if (originalResults.length === 0) {
        // If we get 0 results, we've definitely reached the end
        console.log('No results returned - reached end');
        hasMoreResults = false;
      } else {
        // If we get any results, assume there might be more
        // The only way to know for sure is to try the next page
        // We'll only stop when we get 0 results or hit the 100 limit
        console.log(`Page ${page}: Received ${originalResults.length} results - continuing`);
        hasMoreResults = true;
      }
      
      setHasMore(hasMoreResults);

      const formattedResults = originalResults.map((item) => ({
        title: searchType === 'web' ? item.title : undefined,
        snippet: searchType === 'web' ? item.snippet : undefined,
        link: item.link,
        thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || item.link,
        image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || item.link,
        source: new URL(item.link).hostname,
      }));
      
      if (isLoadMore) {
        // Append new results to existing ones
        setResults(prevResults => {
          const newResults = [...prevResults, ...formattedResults];
          console.log(`Total results after append: ${newResults.length}`);
          return newResults;
        });
      } else {
        // Replace results for new search
        setResults(formattedResults);
        console.log(`Set initial results: ${formattedResults.length}`);
      }

      // Log the search to Firebase (only for new searches, not pagination)
      await logSearch(searchQuery, searchType, originalResults);
    

    } catch (error) {
      console.error('Search error:', error);
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.error || error.message || 'An unexpected error occurred.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unknown error occurred.');
      }
      
      // If it's a load more error, don't show it prominently
      if (isLoadMore) {
        setHasMore(false);
        console.log('Load more failed - setting hasMore to false');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchType, loading, loadingMore, setSearchParams]);

  // Update the original performSearch to use the new helper
  const performSearch = useCallback(async (page: number, isLoadMore = false) => {
    return performSearchWithQuery(query, page, isLoadMore);
  }, [query, performSearchWithQuery]);

  const loadMoreResults = useCallback(() => {
    if (!hasMore || loading || loadingMore) {
      console.log('Load more cancelled - hasMore:', hasMore, 'loading:', loading, 'loadingMore:', loadingMore);
      return;
    }
    
    const nextPage = currentPage + 1;
    console.log('Loading more results - page:', nextPage);
    setCurrentPage(nextPage);
    performSearch(nextPage, true);
  }, [currentPage, hasMore, loading, loadingMore, performSearch]);

  // Intersection Observer for infinite scroll - Fixed useEffect
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        console.log('Intersection observed:', {
          isIntersecting: target.isIntersecting,
          hasMore,
          loading,
          loadingMore,
          resultsLength: results.length
        });
        
        if (target.isIntersecting && hasMore && !loading && !loadingMore && results.length > 0) {
          console.log('Triggering load more from intersection observer');
          loadMoreResults();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    // Attach observer to the load more element
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
      console.log('Observer attached to load more element');
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, results.length, loading, loadingMore, loadMoreResults]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [searchType]);

  const handleQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);

    if (e.target.value.trim() === '') {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await axios.get('https://auto-suggest-queries.p.rapidapi.com/suggestqueries', {
        params: { query: e.target.value },
        headers: {
          'X-RapidAPI-Key': import.meta.env.VITE_APP_RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': import.meta.env.VITE_APP_RAPIDAPI_HOST || ''
        }
      });
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Error fetching auto-suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    console.log('Starting new search for:', query);
    setCurrentPage(1);
    setHasMore(true);
    setResults([]);
    performSearch(1, false);
  }, [query, performSearch]);

  const handleSearchClick = () => {
    setTabsVisible(true);
    setSuggestions([]);
    handleSearch();
  };

  const handleSearchOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setTabsVisible(true);
      setSuggestions([]);
      handleSearch();
    }
  };

  const handleTabChange = (type: 'web' | 'image') => {
    console.log('Changing search type to:', type);
    setSearchType(type);
    setCurrentPage(1);
    setHasMore(true);
    setResults([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setTabsVisible(true);
    setSuggestions([]); // Clear suggestions immediately
    
    // Use the suggestion directly instead of relying on state
    console.log('Starting new search for suggestion:', suggestion);
    setCurrentPage(1);
    setHasMore(true);
    setResults([]);
    
    // Call performSearchWithQuery with the suggestion directly
    performSearchWithQuery(suggestion, 1, false);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed px-4 py-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: `url('https://i.imgur.com/G20z4MI.png')` }}
    >
      <div className="min-h-screen bg-black bg-opacity-20 rounded-lg">
        {/* Logo Container */}
        <div className="flex justify-center pt-6 pb-8">
          <a href="/" className="block">
            <img 
              src="https://i.imgur.com/QTNsUY1.png" 
              alt="Google Logo" 
              className="h-16 w-auto sm:h-20 md:h-24 lg:h-28 cursor-pointer transition-transform duration-200 hover:scale-105" 
            />
          </a>
        </div>

        {/* Device ID Display (for debugging - remove in production) */}
        {deviceId && (
          <div className="text-center mb-4">
            <small className="text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-xs">
              Device ID: {deviceId}
            </small>
          </div>
        )}

        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4">
          {/* Search Section */}
          <div className="relative mb-8">
            {/* Search Bar Container */}
            <div className="max-w-2xl mx-auto relative">
              <div className="flex items-stretch bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200">
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleSearchOnEnter}
                  placeholder="Search Google or type a URL"
                  className="flex-1 outline-none text-base sm:text-lg px-6 py-4 bg-transparent rounded-l-full"
                />
                <button
                  onClick={handleSearchClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-r-full transition-colors duration-200 font-medium whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden text-lg">🔍</span>
                </button>
              </div>

              {/* Auto-suggestions Dropdown */}
              {suggestions.length > 0 && !suggestionsLoading && (
                <ul
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-6 py-3 cursor-pointer hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 text-gray-800 first:rounded-t-xl last:rounded-b-xl"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-3">🔍</span>
                        {suggestion}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              {suggestionsLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading suggestions...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Type Tabs */}
          {tabsVisible && (
            <div className="flex justify-center mb-8">
              <div className="flex bg-white bg-opacity-90 backdrop-blur-sm rounded-full shadow-lg p-1 max-w-xs w-full">
                <button
                  className={`flex-1 py-3 px-6 text-sm sm:text-base font-semibold rounded-full transition-all duration-200 ${
                    searchType === 'web' 
                      ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                      : 'text-gray-700 hover:bg-white hover:bg-opacity-50'
                  }`}
                  onClick={() => handleTabChange('web')}
                >
                  Web
                </button>
                <button
                  className={`flex-1 py-3 px-6 text-sm sm:text-base font-semibold rounded-full transition-all duration-200 ${
                    searchType === 'image' 
                      ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                      : 'text-gray-700 hover:bg-white hover:bg-opacity-50'
                  }`}
                  onClick={() => handleTabChange('image')}
                >
                  Images
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-blue-600 mb-4"></div>
                <span className="text-white font-medium text-lg">Searching...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700 font-medium">Something went wrong</p>
                    <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && !loading && (
            <div className="mb-12">
              {searchType === 'web' ? (
                /* Web Results */
                <div className="space-y-6 max-w-4xl mx-auto">
                  {results.map((item, index) => (
                    <div 
                      key={`${item.link}-${index}`} 
                      className="bg-white bg-opacity-95 backdrop-blur-sm hover:bg-opacity-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {item.thumbnail && (
                            <div className="flex-shrink-0 order-1 lg:order-none">
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full lg:w-32 lg:h-32 h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <p className="text-green-700 text-sm font-medium truncate">
                                {item.source}
                              </p>
                            </div>
                            <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 mb-3 leading-tight">
                              <a 
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {item.title}
                              </a>
                            </h3>
                            <p className="text-gray-700 leading-relaxed line-clamp-3">
                              {item.snippet}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Image Results */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {results.map((item, index) => (
                    <button 
                      key={`${item.link}-${index}`} 
                      onClick={() => setSelectedImage(item)}
                      className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white"
                    >
                      <div className="aspect-square p-1">
                        <img
                          src={item.image}
                          alt={item.title || 'Search result image'}
                          className="w-full h-full object-cover rounded-md group-hover:brightness-110 transition-all duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-200 rounded-lg"></div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Load More Trigger & Loading More Indicator */}
          {results.length > 0 && !loading && (
            <div ref={loadMoreRef} className="text-center py-8">
              {loadingMore && (
                <div className="inline-flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-blue-600 mb-2"></div>
                  <span className="text-white font-medium">Loading more results...</span>
                </div>
              )}
              {!hasMore && !loadingMore && (
                <div className="text-white bg-black bg-opacity-50 px-6 py-3 rounded-full inline-block">
                  <span className="font-medium">
                    {results.length >= 100 ? 'Reached maximum results (100)' : 'No more results'}
                  </span>
                </div>
              )}
              {/* Add a visible element to help with debugging */}
              {hasMore && !loadingMore && (
                <div className="text-white bg-black bg-opacity-30 px-4 py-2 rounded-full inline-block text-sm">
                  Scroll down for more results
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden relative animate-in zoom-in duration-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-lg hover:scale-110"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
              
              {/* Image Container - Takes up most of the modal space */}
              <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                <img 
                  src={selectedImage.image} 
                  alt="Full-size preview" 
                  className="max-w-full max-h-full object-contain shadow-lg"
                  style={{ 
                    minHeight: '200px', // Ensure minimum height for very small images
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;