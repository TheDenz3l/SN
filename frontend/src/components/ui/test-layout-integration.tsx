/**
 * Layout Integration Test Component
 * Tests the unified Layout system components
 */

import React from 'react';
import { HomeIcon, UserIcon, CogIcon } from '@heroicons/react/24/outline';
import { Stack, Inline, Grid, Container, Box, Spacer } from './index';

const TestLayoutIntegration: React.FC = () => {
  const sampleItems = [
    { id: 1, title: 'Item 1', content: 'Content for item 1' },
    { id: 2, title: 'Item 2', content: 'Content for item 2' },
    { id: 3, title: 'Item 3', content: 'Content for item 3' },
    { id: 4, title: 'Item 4', content: 'Content for item 4' },
  ];

  return (
    <Container size="2xl" padding="xl">
      <Stack spacing="2xl">
        <h1 className="text-3xl font-bold">Layout System Integration Test</h1>
        
        {/* Stack Component Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Stack Component</h2>
          <div className="space-y-6">
            
            {/* Basic Stack */}
            <div>
              <h3 className="text-lg font-medium mb-2">Basic Stack</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Stack spacing="md">
                  <div className="bg-blue-100 p-3 rounded">Item 1</div>
                  <div className="bg-blue-100 p-3 rounded">Item 2</div>
                  <div className="bg-blue-100 p-3 rounded">Item 3</div>
                </Stack>
              </div>
            </div>

            {/* Stack with different spacing */}
            <div>
              <h3 className="text-lg font-medium mb-2">Stack with Different Spacing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Small (sm)</p>
                  <Stack spacing="sm">
                    <div className="bg-green-100 p-2 rounded text-sm">Item 1</div>
                    <div className="bg-green-100 p-2 rounded text-sm">Item 2</div>
                  </Stack>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Medium (md)</p>
                  <Stack spacing="md">
                    <div className="bg-yellow-100 p-2 rounded text-sm">Item 1</div>
                    <div className="bg-yellow-100 p-2 rounded text-sm">Item 2</div>
                  </Stack>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Large (xl)</p>
                  <Stack spacing="xl">
                    <div className="bg-red-100 p-2 rounded text-sm">Item 1</div>
                    <div className="bg-red-100 p-2 rounded text-sm">Item 2</div>
                  </Stack>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Inline Component Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Inline Component</h2>
          <div className="space-y-6">
            
            {/* Basic Inline */}
            <div>
              <h3 className="text-lg font-medium mb-2">Basic Inline</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Inline spacing="md" align="center">
                  <HomeIcon className="w-5 h-5" />
                  <span>Home</span>
                  <UserIcon className="w-5 h-5" />
                  <span>Profile</span>
                  <CogIcon className="w-5 h-5" />
                  <span>Settings</span>
                </Inline>
              </div>
            </div>

            {/* Inline with different justification */}
            <div>
              <h3 className="text-lg font-medium mb-2">Inline with Justification</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Space Between</p>
                  <Inline justify="between" align="center">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                  </Inline>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Center</p>
                  <Inline justify="center" align="center" spacing="lg">
                    <div className="bg-blue-100 px-3 py-1 rounded">Item 1</div>
                    <div className="bg-blue-100 px-3 py-1 rounded">Item 2</div>
                    <div className="bg-blue-100 px-3 py-1 rounded">Item 3</div>
                  </Inline>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid Component Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Grid Component</h2>
          <div className="space-y-6">
            
            {/* Basic Grid */}
            <div>
              <h3 className="text-lg font-medium mb-2">Basic Grid</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Grid cols={3} gap="md">
                  {sampleItems.map(item => (
                    <div key={item.id} className="bg-purple-100 p-3 rounded">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.content}</p>
                    </div>
                  ))}
                </Grid>
              </div>
            </div>

            {/* Responsive Grid */}
            <div>
              <h3 className="text-lg font-medium mb-2">Responsive Grid</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <Grid 
                  cols={{ base: 1, sm: 2, md: 3, lg: 4 }} 
                  gap={{ base: 'sm', md: 'md', lg: 'lg' }}
                >
                  {sampleItems.map(item => (
                    <div key={item.id} className="bg-indigo-100 p-3 rounded">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.content}</p>
                    </div>
                  ))}
                </Grid>
              </div>
            </div>
          </div>
        </section>

        {/* Container Component Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Container Component</h2>
          <div className="space-y-6">
            
            {/* Different Container Sizes */}
            <div>
              <h3 className="text-lg font-medium mb-2">Container Sizes</h3>
              <Stack spacing="md">
                <Container size="sm" padding="md" className="bg-gray-100 border-2 border-dashed border-gray-300">
                  <p className="text-center">Small Container (max-w-sm)</p>
                </Container>
                <Container size="md" padding="md" className="bg-gray-100 border-2 border-dashed border-gray-300">
                  <p className="text-center">Medium Container (max-w-md)</p>
                </Container>
                <Container size="lg" padding="md" className="bg-gray-100 border-2 border-dashed border-gray-300">
                  <p className="text-center">Large Container (max-w-lg)</p>
                </Container>
              </Stack>
            </div>
          </div>
        </section>

        {/* Box Component Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Box Component</h2>
          <div className="space-y-6">
            
            {/* Box with different padding */}
            <div>
              <h3 className="text-lg font-medium mb-2">Box with Padding</h3>
              <div className="grid grid-cols-3 gap-4">
                <Box p="sm" className="bg-orange-100 border border-orange-200 rounded">
                  <p className="text-sm">Small padding</p>
                </Box>
                <Box p="md" className="bg-orange-100 border border-orange-200 rounded">
                  <p className="text-sm">Medium padding</p>
                </Box>
                <Box p="lg" className="bg-orange-100 border border-orange-200 rounded">
                  <p className="text-sm">Large padding</p>
                </Box>
              </div>
            </div>

            {/* Box with different margins */}
            <div>
              <h3 className="text-lg font-medium mb-2">Box with Margins</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <Box mx="auto" p="md" className="bg-teal-100 border border-teal-200 rounded max-w-xs">
                  <p className="text-sm text-center">Centered with auto margins</p>
                </Box>
              </div>
            </div>
          </div>
        </section>

        {/* Spacer Component Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Spacer Component</h2>
          <div className="space-y-6">
            
            {/* Vertical Spacer */}
            <div>
              <h3 className="text-lg font-medium mb-2">Vertical Spacer</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="bg-pink-100 p-2 rounded">Content Above</div>
                <Spacer size="xl" direction="vertical" />
                <div className="bg-pink-100 p-2 rounded">Content Below</div>
              </div>
            </div>

            {/* Horizontal Spacer */}
            <div>
              <h3 className="text-lg font-medium mb-2">Horizontal Spacer</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-cyan-100 p-2 rounded">Left</div>
                  <Spacer size="lg" direction="horizontal" />
                  <div className="bg-cyan-100 p-2 rounded">Right</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-world Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Real-world Example</h2>
          <Container size="lg" padding="lg" className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <Stack spacing="lg">
              <Inline justify="between" align="center">
                <h3 className="text-xl font-semibold">Dashboard</h3>
                <Inline spacing="sm">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Export</button>
                  <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm">Settings</button>
                </Inline>
              </Inline>
              
              <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
                {sampleItems.slice(0, 3).map(item => (
                  <Box key={item.id} p="md" className="bg-gray-50 rounded-lg">
                    <Stack spacing="sm">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.content}</p>
                      <Inline spacing="xs" justify="end">
                        <button className="text-xs text-blue-600 hover:underline">Edit</button>
                        <button className="text-xs text-red-600 hover:underline">Delete</button>
                      </Inline>
                    </Stack>
                  </Box>
                ))}
              </Grid>
            </Stack>
          </Container>
        </section>
      </Stack>
    </Container>
  );
};

export default TestLayoutIntegration;
