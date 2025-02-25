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
  const resultsPerPage = 10;
  const maxResults = 100;

  useEffect(() => {
    handleSearch(page);

  }, [searchType, page, tabsVisible]); // Runs when quer

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
    handleSearch();
  };

  const handleSearchOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1); // Reset to the first page whenever the Enter key is pressed
      setTabsVisible(true); // Show tabs once search is triggered
      handleSearch();
    }
  };

  const handleTabChange = (type: 'web' | 'image') => {
    setSearchType(type);
    setPage(1); // Reset to the first page whenever the tab is changed
    setResults([]); // Clear previous results
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
            onChange={(e) => setQuery(e.target.value)}
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
        <div className="mt-6 space-y-4">
  {searchType === 'web' ? (
    results.map((item, index) => (
      <div key={index} className="bg-white p-4 rounded-lg shadow-md flex items-start">
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
          <img
            src={item.thumbnail}
            alt="Search result"
            className="w-full h-40 object-cover rounded-lg shadow-md transition-transform hover:scale-105"
          />
        </button>
      ))}
    </div>
  )}
</div>



        {/* Pagination Controls */}
        {results.length > 0 && (
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={() => handleSearch(page - 1)}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg ${
                page === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Previous
            </button>

            <span className="text-lg font-semibold">Page {page}</span>

            <button
              onClick={() => handleSearch(page + 1)}
              disabled={page * 10 >= 100} // Disable Next when max 100 results are reached
              className={`px-4 py-2 rounded-lg ${
                page * 10 >= 100
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white p-4 rounded-lg shadow-lg max-w-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img src={selectedImage.image} alt="Full-size" className="w-full max-h-[500px] object-contain rounded-lg" />
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold">{selectedImage.title || 'Image Preview'}</p>
              <p className="text-sm text-gray-500">{selectedImage.source}</p>
              <a
                href={selectedImage.link}

                className="text-blue-500 hover:underline"
              >
                View Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search; 