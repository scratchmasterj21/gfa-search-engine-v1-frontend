import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

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
  const initialPage = Number(searchParams.get('page')) || 1;  // Get page from URL

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'web' | 'image'>(initialSearchType);
  const [page, setPage] = useState(initialPage);
  const [tabsVisible, setTabsVisible] = useState(initialQuery !== '');

  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null);
  // For auto-suggest
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    handleSearch(page);
  }, [searchType, page, tabsVisible]); // Runs when query changes, or page/tabsVisible changes

  // Fetch auto-suggestions as the user types
  const handleQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);

    if (e.target.value.trim() === '') {
      setSuggestions([]); // Clear suggestions if query is empty
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

  const handleSearch = async (newPage = 1) => {
    if (!query) return;

    setLoading(true);

    try {
      const startIndex = (newPage - 1) * 10 + 1; // Correctly calculate the starting index for pagination
      setSearchParams({ query, searchType, page: String(newPage) }); // Update URL

      if (startIndex > 100) return; // Limit to a maximum of 100 results

      const response = await axios.get<{ items: any[] }>(
        `https://backend.carlo587-jcl.workers.dev/search`,
        {
          params: {
            query: query,
            searchType: searchType,
            start: startIndex, // Pass the correct start value
          },
        }
      );

      const formattedResults = response.data.items?.map((item) => ({
        title: searchType === 'web' ? item.title : undefined,
        snippet: searchType === 'web' ? item.snippet : undefined,
        link: item.link,
        thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || item.link,
        image: item.pagemap?.cse_image?.[0]?.src || item.link,
        source: new URL(item.link).hostname,
      })) || [];

      setResults(formattedResults);
      setPage(newPage); // Update the current page number

    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    setPage(1); // Reset to the first page whenever a new search is triggered
    setTabsVisible(true); // Show tabs once search is triggered
    setSuggestions([]); // Clear suggestions
    handleSearch(); // Trigger search
  };

  const handleSearchOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1); // Reset to the first page whenever the Enter key is pressed
      setTabsVisible(true); // Show tabs once search is triggered
      setSuggestions([]); // Clear suggestions
      handleSearch(); // Trigger search
    }
  };

  const handleTabChange = (type: 'web' | 'image') => {
    setSearchType(type);
    setPage(1); // Reset to the first page whenever the tab is changed
    setResults([]); // Clear previous results
  };

  // Handle clicking a suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion); // Set the query to the suggestion
    setSuggestions([]); // Close the suggestion list
    setPage(1); // Start from the first page of results
    setTabsVisible(true); // Show tabs
    handleSearch(); // Trigger search
  };

  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen bg-cover bg-center p-4"
      style={{ backgroundImage: `url('https://i.imgur.com/G20z4MI.png')` }}
    >
      {/* Google Logo - Click to go home */}
      <a href="/" className="mt-10 mb-4">
        <img src="https://i.imgur.com/QTNsUY1.png" alt="Google Logo" className="w-60 cursor-pointer" />
      </a>

      <div className="w-full max-w-2xl">
        {/* Search Bar */}
        <div className="flex items-center bg-white rounded-full shadow-lg p-4">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleSearchOnEnter} // Press Enter to search
            placeholder="Search..."
            className="flex-grow outline-none text-lg px-4 bg-transparent"
          />
          <button
            onClick={handleSearchClick}
            className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition"
          >
            Search
          </button>
        </div>

        {/* Auto-suggestions */}
        {suggestions.length > 0 && !suggestionsLoading && (
          <ul className="mt-2 bg-white border border-gray-300 rounded-lg shadow-md absolute w-full max-w-2xl">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSuggestionClick(suggestion)} // Use the handleSuggestionClick function
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        {suggestionsLoading && <p>Loading suggestions...</p>}

        {/* Tabs for Web and Image Search */}
        {tabsVisible && (
          <div className="flex justify-center mb-4 bg-white rounded-full shadow-md p-1 mt-4">
            <button
              className={`flex-1 py-2 text-lg font-semibold rounded-full transition ${
                searchType === 'web' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleTabChange('web')}
            >
              Web
            </button>
            <button
              className={`flex-1 py-2 text-lg font-semibold rounded-full transition ${
                searchType === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleTabChange('image')}
            >
              Images
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && <p className="text-center text-gray-500 mt-4">Loading...</p>}

        {/* Search Results */}
        <div className="mt-6 bg-white bg-opacity-50 space-y-4">
          {searchType === 'web' ? (
            results.map((item, index) => (
              <div key={index} className="bg-white bg-opacity-50 p-4 rounded-lg shadow-md flex items-start">
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg mr-4"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-blue-600">
                    <a href={item.link}>
                      {item.title}
                    </a>
                  </h3>
                  <p className="text-gray-500 text-sm">{item.source}</p> {/* Display the URL */}
                  <p className="text-gray-700 mt-2">{item.snippet}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {results.map((item, index) => (
                <button key={index} onClick={() => setSelectedImage(item)}>
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-auto object-cover rounded-md shadow-md"
                    />
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="absolute top-0 right-0 w-12 h-12 object-cover rounded-full border-4 border-white"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Image Modal (If Any Image Is Selected) */}
        {selectedImage && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
              <img
                src={selectedImage.image || selectedImage.link}
                alt={selectedImage.title}
                className="w-full h-auto object-cover rounded-lg mb-4"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black rounded-full p-2"
              >
                X
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
