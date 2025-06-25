import React, { useState, useEffect, useRef } from 'react';
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
  const initialPage = Number(searchParams.get('page')) || 1;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'web' | 'image'>(initialSearchType);
  const [page, setPage] = useState(initialPage);
  const [tabsVisible, setTabsVisible] = useState(initialQuery !== '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  
  const suggestionsRef = useRef<HTMLUListElement | null>(null);

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

  useEffect(() => {
    if (initialQuery) {
      handleSearch(page);
    }
  }, [searchType, page, tabsVisible]);

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

  // Updated handleSearch function in your React component
const handleSearch = async (newPage = 1) => {
  if (!query) return;

  setLoading(true);
  setErrorMessage(null);

  try {
    const startIndex = (newPage - 1) * 10 + 1;
    setSearchParams({ query, searchType, page: String(newPage) });

    if (startIndex > 100) return;

    const response = await axios.get<{ items: any[] }>(
      `https://backend.carlo587-jcl.workers.dev/search`,
      {
        params: {
          query: query,
          searchType: searchType,
          start: startIndex,
        },
      }
    );

    // Store original results before formatting
    const originalResults = response.data.items || [];

    const formattedResults = originalResults.map((item) => ({
      title: searchType === 'web' ? item.title : undefined,
      snippet: searchType === 'web' ? item.snippet : undefined,
      link: item.link,
      thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || item.link,
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || item.link,
      source: new URL(item.link).hostname,
    }));
    
    setResults(formattedResults);
    setPage(newPage);

    // Log the search to Firebase (only for new searches, not pagination)
    // Pass both original and formatted results
    if (newPage === 1) {
      await logSearch(query, searchType, originalResults);
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      setErrorMessage(error.response?.data?.error || error.message || 'An unexpected error occurred.');
    } else if (error instanceof Error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage('An unknown error occurred.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleSearchClick = () => {
    setPage(1);
    setTabsVisible(true);
    setSuggestions([]);
    handleSearch();
  };

  const handleSearchOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setTabsVisible(true);
      setSuggestions([]);
      handleSearch();
    }
  };

  const handleTabChange = (type: 'web' | 'image') => {
    setSearchType(type);
    setPage(1);
    setResults([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setPage(1);
    setTabsVisible(true);
    handleSearch();
    setTimeout(() => {
      setSuggestions([]);
    }, 100);
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
                      key={index} 
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
                      key={index} 
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

          {/* Pagination */}
          {results.length > 0 && !loading && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSearch(page - 1)}
                  disabled={page === 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                    page === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="bg-white bg-opacity-90 backdrop-blur-sm px-6 py-3 rounded-full shadow-md">
                  <span className="font-semibold text-gray-800">
                    Page {page}
                  </span>
                </div>

                <button
                  onClick={() => handleSearch(page + 1)}
                  disabled={page * 10 >= 100}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                    page * 10 >= 100
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <span>→</span>
                </button>
              </div>
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
              className="bg-white rounded-2xl shadow-2xl max-w-5xl max-h-[90vh] overflow-hidden relative animate-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-lg hover:scale-110"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
              
              <div className="max-h-[70vh] overflow-hidden">
                <img 
                  src={selectedImage.image} 
                  alt="Full-size preview" 
                  className="w-full h-full object-contain bg-gray-50"
                />
              </div>
              
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                  {selectedImage.title || 'Image Preview'}
                </h3>
                <p className="text-sm text-gray-600 mb-4 truncate">
                  Source: {selectedImage.source}
                </p>
                <a
                  href={selectedImage.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <span>View Original</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;