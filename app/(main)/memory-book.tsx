import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bookmark, 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Clock, 
  DollarSign, 
  Calendar, 
  FileText, 
  Plus,
  ChevronRight,
  Heart,
  Trash2,
  Users,
  Camera,
  Sparkles
} from 'lucide-react-native';
import Logo from '@/components/ui/Logo';
import PolaroidFrame from '@/components/ui/PolaroidFrame';
import FloatingPolaroids from '@/components/ui/FloatingPolaroids';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import Colors from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/design';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { useAlert } from '@/contexts/AlertContext';
import { SavedActivity } from '@/types/activity';
import FilterPill from '@/components/ui/FilterPill';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODE_KEY = 'scratch_and_go_mode';

type Tab = 'upcoming' | 'memories';
type Mode = 'couples' | 'family';

const COST_FILTERS = ['All', 'Free', '$', '$$', '$$$'];
const CATEGORY_FILTERS = ['All', 'Chill', 'Active', 'Creative', 'Foodie', 'Adventure', 'Outdoor', 'Educational'];
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'alphabetical', label: 'A to Z' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

type SortOption = 'date-desc' | 'date-asc' | 'alphabetical' | 'rating-desc';

// Mode-specific copy
const getModeContent = (mode: Mode) => ({
  couples: {
    title: 'Our Memories',
    upcomingSubtitle: 'Date ideas waiting to happen',
    memoriesSubtitle: 'Moments we\'ve treasured together',
    emptyUpcoming: 'Save date ideas to plan your next adventure together',
    emptyMemories: 'Complete dates to build your love story',
    addPrompt: 'Add a new date memory',
    memoryCardPrompt: 'Add photos from your date',
  },
  family: {
    title: 'Family Memories',
    upcomingSubtitle: 'Adventures waiting for the whole family',
    memoriesSubtitle: 'Moments we\'ve shared as a family',
    emptyUpcoming: 'Save activities to plan your next family adventure',
    emptyMemories: 'Complete activities to build family memories',
    addPrompt: 'Add a new family memory',
    memoryCardPrompt: 'Add photos from your adventure',
  },
});

export default function MemoryBookScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCost, setSelectedCost] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [mode, setMode] = useState<Mode>('couples');
  
  const { 
    getSavedActivities, 
    getActiveActivities, 
    getCompletedActivities, 
    markAsCompleted, 
    markAsIncomplete, 
    unsaveActivity 
  } = useMemoryBook();
  const { alert, showError } = useAlert();

  // Load mode
  useEffect(() => {
    const loadMode = async () => {
      const savedMode = await AsyncStorage.getItem(MODE_KEY);
      if (savedMode) {
        setMode(savedMode as Mode);
      }
    };
    loadMode();
  }, []);

  const content = getModeContent(mode)[mode];

  // Handle tab query parameter (e.g., when redirected from activity completion)
  useEffect(() => {
    if (params.tab === 'memories') {
      setActiveTab('memories');
    }
  }, [params.tab]);

  // Separate saved for later and active activities for "upcoming" tab
  const savedForLaterActivities = useMemo(() => {
    return getSavedActivities(); // Activities saved but not started (isActive: false, isCompleted: false)
  }, [getSavedActivities]);
  
  const activeActivities = useMemo(() => {
    return getActiveActivities(); // Activities currently in progress (isActive: true, isCompleted: false)
  }, [getActiveActivities]);
  
  const upcomingActivities = useMemo(() => {
    return [...savedForLaterActivities, ...activeActivities];
  }, [savedForLaterActivities, activeActivities]);

  const completedActivities = getCompletedActivities();

  // Get all user photos for decorative elements
  const allUserPhotos = useMemo(() => {
    return completedActivities
      .filter(a => a.photos && a.photos.length > 0)
      .flatMap(a => a.photos!)
      .slice(0, 10);
  }, [completedActivities]);

  const filteredActivities = useMemo(() => {
    // For upcoming tab, we need to filter from the combined list but maintain separation
    const activities = activeTab === 'upcoming' ? upcomingActivities : completedActivities;
    
    let filtered = activities;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.category.toLowerCase().includes(query)
      );
    }

    if (selectedCost !== 'All') {
      filtered = filtered.filter(activity => {
        const cost = activity.cost.toLowerCase();
        const filter = selectedCost.toLowerCase();
        if (filter === 'free') return cost === 'free';
        return cost === filter;
      });
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(activity => 
        activity.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (b.completedAt || b.savedAt) - (a.completedAt || a.savedAt);
        case 'date-asc':
          return (a.completedAt || a.savedAt) - (b.completedAt || b.savedAt);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'rating-desc':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [activeTab, upcomingActivities, completedActivities, searchQuery, selectedCost, selectedCategory, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const handleDelete = (activityId: string, activityTitle: string, isMemory: boolean) => {
    alert(
      isMemory ? 'Delete Memory' : 'Remove Activity',
      isMemory 
        ? `Are you sure you want to delete "${activityTitle}" from your Memory Book? This cannot be undone.`
        : `Are you sure you want to remove "${activityTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isMemory ? 'Delete' : 'Remove',
          style: 'destructive',
          onPress: () => unsaveActivity(activityId),
        },
      ],
      'warning'
    );
  };

  const handleActivityPress = (activity: SavedActivity) => {
    if (!activity?.id) {
      showError('Error', 'Invalid activity.');
      return;
    }
    router.push(`/activity/${activity.id}` as any);
  };

  const hasActiveFilters = searchQuery.trim() || selectedCost !== 'All' || selectedCategory !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCost('All');
    setSelectedCategory('All');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Decorative Floating Polaroids - only show when we have memories (behind content) */}
      {allUserPhotos.length > 0 && activeTab === 'memories' && (
        <View style={styles.floatingPolaroidsContainer}>
          <FloatingPolaroids
            userImages={allUserPhotos}
            mode={mode}
            density="sparse"
            showGradient={false}
            animated={true}
          />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconBadge}>
              {mode === 'couples' ? (
                <Heart size={18} color={Colors.primary} fill={Colors.primary} />
              ) : (
                <Users size={18} color={Colors.primary} />
              )}
            </View>
            <View>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>
                {activeTab === 'upcoming' ? content.upcomingSubtitle : content.memoriesSubtitle}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/log-activity' as any)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Plus size={20} color={Colors.backgroundDark} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.7}
        >
          <Bookmark 
            size={18} 
            color={activeTab === 'upcoming' ? Colors.primary : Colors.textLight}
          />
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'upcoming' && styles.tabBadgeTextActive]}>
              {upcomingActivities.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'memories' && styles.tabActive]}
          onPress={() => setActiveTab('memories')}
          activeOpacity={0.7}
        >
          <Camera 
            size={18} 
            color={activeTab === 'memories' ? Colors.primary : Colors.textLight}
          />
          <Text style={[styles.tabText, activeTab === 'memories' && styles.tabTextActive]}>
            Memories
          </Text>
          <View style={[styles.tabBadge, activeTab === 'memories' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'memories' && styles.tabBadgeTextActive]}>
              {completedActivities.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={mode === 'couples' ? "Search dates..." : "Search activities..."}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={18} color={showFilters ? Colors.primary : Colors.textLight} />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterRow}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Budget</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterChips}>
                  {COST_FILTERS.map((cost) => (
                    <FilterPill
                      key={cost}
                      label={cost}
                      selected={selectedCost === cost}
                      onPress={() => setSelectedCost(cost)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterChips}>
                  {CATEGORY_FILTERS.map((category) => (
                    <FilterPill
                      key={category}
                      label={category}
                      selected={selectedCategory === category}
                      onPress={() => setSelectedCategory(category)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters} activeOpacity={0.7}>
              <X size={14} color={Colors.textLight} />
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sort Button */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.7}
        >
          <ArrowUpDown size={14} color={Colors.textLight} />
          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
          </Text>
        </TouchableOpacity>

        {showSortMenu && (
          <View style={styles.sortMenu}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortMenuItem, sortBy === option.value && styles.sortMenuItemActive]}
                onPress={() => {
                  setSortBy(option.value as SortOption);
                  setShowSortMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortMenuItemText, sortBy === option.value && styles.sortMenuItemTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      {filteredActivities.length === 0 ? (
        <View style={styles.emptyState}>
          {/* Empty Polaroids decoration */}
          <View style={styles.emptyPolaroidsRow}>
            <PolaroidFrame
              size="small"
              isEmpty
              mode={mode}
              rotation={-8}
              style={{ opacity: 0.6 }}
            />
            <PolaroidFrame
              size="small"
              isEmpty
              mode={mode}
              rotation={4}
              style={{ marginTop: 20, opacity: 0.8 }}
            />
            <PolaroidFrame
              size="small"
              isEmpty
              mode={mode}
              rotation={-3}
              style={{ opacity: 0.6 }}
            />
          </View>
          
          <Text style={styles.emptyTitle}>
            {hasActiveFilters
              ? 'No matches found'
              : activeTab === 'upcoming' 
                ? 'No adventures planned yet' 
                : 'No memories yet'
            }
          </Text>
          <Text style={styles.emptyText}>
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : activeTab === 'upcoming'
                ? content.emptyUpcoming
                : content.emptyMemories
            }
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.emptyButton} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.emptyButtonText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Memories Grid - Polaroid style */}
          {activeTab === 'memories' ? (
            <View style={styles.memoriesGrid}>
              {filteredActivities.map((activity) => (
                <MemoryPolaroidCard
                  key={activity.id}
                  activity={activity}
                  mode={mode}
                  onPress={() => handleActivityPress(activity)}
                  onDelete={() => handleDelete(activity.id, activity.title, true)}
                />
              ))}
            </View>
          ) : (
            // Upcoming list - separated by "Saved for Later" and "In Progress"
            <View>
              {/* In Progress Section */}
              {(() => {
                const activeFiltered = filteredActivities.filter(a => a.isActive && !a.isCompleted);
                if (activeFiltered.length === 0) return null;
                
                return (
                  <>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderContent}>
                        <View style={styles.sectionIconContainer}>
                          <Clock size={16} color={Colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>In Progress</Text>
                        <View style={styles.sectionBadge}>
                          <Text style={styles.sectionBadgeText}>{activeFiltered.length}</Text>
                        </View>
                      </View>
                    </View>
                    {activeFiltered.map((activity) => (
                      <UpcomingActivityCard
                        key={activity.id}
                        activity={activity}
                        mode={mode}
                        isActive={true}
                        onPress={() => handleActivityPress(activity)}
                        onDelete={() => handleDelete(activity.id, activity.title, false)}
                      />
                    ))}
                  </>
                );
              })()}
              
              {/* Saved for Later Section */}
              {(() => {
                const savedFiltered = filteredActivities.filter(a => !a.isActive && !a.isCompleted);
                if (savedFiltered.length === 0) return null;
                
                return (
                  <>
                    <View style={[styles.sectionHeader, activeActivities.length > 0 && styles.sectionHeaderWithMargin]}>
                      <View style={styles.sectionHeaderContent}>
                        <View style={styles.sectionIconContainer}>
                          <Bookmark size={16} color={Colors.accent} />
                        </View>
                        <Text style={styles.sectionTitle}>Saved for Later</Text>
                        <View style={styles.sectionBadge}>
                          <Text style={styles.sectionBadgeText}>{savedFiltered.length}</Text>
                        </View>
                      </View>
                    </View>
                    {savedFiltered.map((activity) => (
                      <UpcomingActivityCard
                        key={activity.id}
                        activity={activity}
                        mode={mode}
                        isActive={false}
                        onPress={() => handleActivityPress(activity)}
                        onDelete={() => handleDelete(activity.id, activity.title, false)}
                      />
                    ))}
                  </>
                );
              })()}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Memory card styled as Polaroid
interface MemoryPolaroidCardProps {
  activity: SavedActivity;
  mode: Mode;
  onPress: () => void;
  onDelete: () => void;
}

function MemoryPolaroidCard({ activity, mode, onPress, onDelete }: MemoryPolaroidCardProps) {
  const hasPhotos = activity.photos && activity.photos.length > 0;
  const firstPhoto = hasPhotos ? activity.photos![0] : null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.memoryCardContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.polaroidCard}>
          {/* Photo or Empty State */}
          <View style={styles.polaroidImageContainer}>
            {firstPhoto ? (
              <Image
                source={{ uri: firstPhoto }}
                style={styles.polaroidImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.polaroidEmptyImage}>
                <View style={styles.polaroidEmptyIcon}>
                  {mode === 'couples' ? (
                    <Heart size={24} color={Colors.primary} />
                  ) : (
                    <Users size={24} color={Colors.primary} />
                  )}
                </View>
                <Text style={styles.polaroidEmptyText}>Add photos</Text>
              </View>
            )}
            
            {/* Photo count badge */}
            {hasPhotos && activity.photos!.length > 1 && (
              <View style={styles.photoCountBadge}>
                <Camera size={10} color={Colors.white} />
                <Text style={styles.photoCountText}>{activity.photos!.length}</Text>
              </View>
            )}

            {/* Rating stars overlay */}
            {activity.rating && (
              <View style={styles.ratingOverlay}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <View
                    key={star}
                    style={[
                      styles.ratingStar,
                      star <= activity.rating! && styles.ratingStarFilled,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Caption area */}
          <View style={styles.polaroidCaption}>
            <Text style={styles.polaroidTitle} numberOfLines={2}>
              {activity.title}
            </Text>
            {activity.completedAt && (
              <Text style={styles.polaroidDate}>
                {formatDate(activity.completedAt)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.polaroidDeleteButton}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Trash2 size={14} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

// Upcoming activity card - enhanced
interface UpcomingActivityCardProps {
  activity: SavedActivity;
  mode: Mode;
  isActive?: boolean;
  onPress: () => void;
  onDelete: () => void;
}

function UpcomingActivityCard({ activity, mode, isActive = false, onPress, onDelete }: UpcomingActivityCardProps) {
  return (
    <View style={styles.upcomingCardWrapper}>
      <TouchableOpacity
        style={styles.upcomingCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Category icon with playful styling */}
        <View style={styles.upcomingIconContainer}>
          <View style={[styles.upcomingIcon, isActive && styles.upcomingIconActive]}>
            {mode === 'couples' ? (
              <Heart size={20} color={isActive ? Colors.primary : Colors.textLight} />
            ) : (
              <Users size={20} color={isActive ? Colors.primary : Colors.textLight} />
            )}
          </View>
          {/* Status indicator */}
          {isActive ? (
            <View style={styles.miniPolaroidAccent}>
              <Clock size={10} color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.miniPolaroidAccent}>
              <Bookmark size={10} color={Colors.accent} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.upcomingContent}>
          <Text style={styles.upcomingTitle} numberOfLines={2}>{activity.title}</Text>
          <Text style={styles.upcomingDescription} numberOfLines={2}>{activity.description}</Text>

          {/* Meta info */}
          <View style={styles.upcomingMeta}>
            <View style={styles.metaItem}>
              <Clock size={12} color={Colors.textLight} />
              <Text style={styles.metaText}>{activity.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <DollarSign size={12} color={Colors.textLight} />
              <Text style={styles.metaText}>{activity.cost === 'free' ? 'Free' : activity.cost}</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <ChevronRight size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Trash2 size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  floatingPolaroidsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.sizes.h1,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '500' as const,
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabBadge: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
  },
  tabBadgeText: {
    fontSize: Typography.sizes.tiny,
    fontWeight: '600' as const,
    color: Colors.textLight,
  },
  tabBadgeTextActive: {
    color: Colors.backgroundDark,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    zIndex: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    paddingVertical: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },

  // Filters
  filtersPanel: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    zIndex: 10,
  },
  filterRow: {
    marginBottom: Spacing.md,
  },
  filterSection: {
    gap: Spacing.sm,
  },
  filterLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  clearFiltersText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },

  // Sort
  sortContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    zIndex: 100,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sortButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  sortMenu: {
    position: 'absolute',
    top: 36,
    left: Spacing.lg,
    backgroundColor: Colors.cardBackgroundElevated,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: 160,
    zIndex: 100,
    elevation: 8,
    ...Shadows.large,
  },
  sortMenuItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  sortMenuItemActive: {
    backgroundColor: Colors.primaryMuted,
  },
  sortMenuItemText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text,
  },
  sortMenuItemTextActive: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },

  // Content
  content: {
    flex: 1,
    zIndex: 2,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Memories Grid
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },

  // Memory Polaroid Card
  memoryCardContainer: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.sm,
  },
  polaroidCard: {
    backgroundColor: '#F5F5F0',
    borderRadius: 3,
    padding: 6,
    paddingBottom: 28,
    ...Shadows.medium,
  },
  polaroidImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundLight,
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
  },
  polaroidEmptyImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  polaroidEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  polaroidEmptyText: {
    fontSize: Typography.sizes.small,
    color: Colors.textMuted,
  },
  photoCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.small,
  },
  photoCountText: {
    fontSize: Typography.sizes.tiny,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  ratingOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    gap: 3,
  },
  ratingStar: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  ratingStarFilled: {
    backgroundColor: Colors.accent,
  },
  polaroidCaption: {
    marginTop: 'auto',
    paddingTop: 8,
  },
  polaroidTitle: {
    fontSize: Typography.sizes.small,
    fontWeight: '500' as const,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  polaroidDate: {
    fontSize: Typography.sizes.tiny,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  polaroidDeleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Upcoming Card
  upcomingCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  upcomingCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  upcomingIconContainer: {
    position: 'relative',
  },
  upcomingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  upcomingIconActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  miniPolaroidAccent: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeaderWithMargin: {
    marginTop: Spacing.xl,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sectionBadgeText: {
    fontSize: Typography.sizes.tiny,
    fontWeight: '600' as const,
    color: Colors.textLight,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  upcomingDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  upcomingMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    zIndex: 2,
  },
  emptyPolaroidsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  emptyButtonText: {
    fontSize: Typography.sizes.caption,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
});
