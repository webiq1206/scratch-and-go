import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { 
  Bookmark, 
  CheckCircle2, 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Clock, 
  DollarSign, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  Plus,
  ChevronRight,
  Heart
} from 'lucide-react-native';
import Logo from '@/components/ui/Logo';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import Colors from '@/constants/colors';
import { BorderRadius } from '@/constants/design';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { SavedActivity } from '@/types/activity';
import FilterPill from '@/components/ui/FilterPill';

type Tab = 'upcoming' | 'memories';

const COST_FILTERS = ['All', 'Free', '$', '$$', '$$$'];
const CATEGORY_FILTERS = ['All', 'Chill', 'Active', 'Creative', 'Foodie', 'Adventure', 'Outdoor', 'Educational'];
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'alphabetical', label: 'A to Z' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

type SortOption = 'date-desc' | 'date-asc' | 'alphabetical' | 'rating-desc';

export default function MemoryBookScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCost, setSelectedCost] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const { 
    getSavedActivities, 
    getActiveActivities, 
    getCompletedActivities, 
    markAsCompleted, 
    markAsIncomplete, 
    unsaveActivity 
  } = useMemoryBook();

  // Combine saved and active for "upcoming" tab
  const upcomingActivities = useMemo(() => {
    const saved = getSavedActivities();
    const active = getActiveActivities();
    return [...saved, ...active].filter(a => !a.isCompleted);
  }, [getSavedActivities, getActiveActivities]);

  const completedActivities = getCompletedActivities();

  const filteredActivities = useMemo(() => {
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

  const handleDelete = (activityId: string, activityTitle: string) => {
    Alert.alert(
      'Remove Activity',
      `Are you sure you want to remove "${activityTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => unsaveActivity(activityId),
        },
      ]
    );
  };

  const handleActivityPress = (activity: SavedActivity) => {
    if (!activity?.id) {
      Alert.alert('Error', 'Invalid activity.');
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Memories</Text>
            <Text style={styles.subtitle}>
              {activeTab === 'upcoming' ? 'Adventures waiting to happen' : 'Moments you\'ve treasured'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/log-activity' as any)}
            activeOpacity={0.7}
          >
            <Plus size={20} color={Colors.primary} />
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
          <Heart 
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
            placeholder="Search activities..."
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
          <View style={styles.emptyIconContainer}>
            {activeTab === 'upcoming' ? (
              <Logo size={56} color={Colors.textMuted} />
            ) : (
              <Heart size={48} color={Colors.textMuted} />
            )}
          </View>
          <Text style={styles.emptyTitle}>
            {hasActiveFilters
              ? 'No matches found'
              : activeTab === 'upcoming' 
                ? 'No activities saved yet' 
                : 'No memories yet'
            }
          </Text>
          <Text style={styles.emptyText}>
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : activeTab === 'upcoming'
                ? 'Save activities from the Discover tab to plan your adventures'
                : 'Complete activities to create lasting memories'
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
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isMemory={activeTab === 'memories'}
              onPress={() => handleActivityPress(activity)}
              onComplete={() => markAsCompleted(activity.id)}
              onUncomplete={() => markAsIncomplete(activity.id)}
              onDelete={() => handleDelete(activity.id, activity.title)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface ActivityCardProps {
  activity: SavedActivity;
  isMemory: boolean;
  onPress: () => void;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
}

function ActivityCard({ activity, isMemory, onPress, onComplete, onUncomplete, onDelete }: ActivityCardProps) {
  const hasPhotos = activity.photos && activity.photos.length > 0;
  const hasNotes = activity.notes && activity.notes.trim().length > 0;
  const firstPhoto = hasPhotos ? activity.photos![0] : null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Photo thumbnail for memories */}
      {isMemory && (
        <View style={styles.cardPhotoContainer}>
          {firstPhoto ? (
            <Image source={{ uri: firstPhoto }} style={styles.cardPhoto} contentFit="cover" />
          ) : (
            <View style={styles.cardPhotoPlaceholder}>
              <ImageIcon size={24} color={Colors.textMuted} />
            </View>
          )}
          {hasPhotos && activity.photos!.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>{activity.photos!.length}</Text>
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <View style={[styles.cardContent, !isMemory && styles.cardContentFull]}>
        <Text style={styles.cardTitle} numberOfLines={2}>{activity.title}</Text>
        
        {!isMemory && (
          <Text style={styles.cardDescription} numberOfLines={2}>{activity.description}</Text>
        )}

        {/* Meta info */}
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Clock size={12} color={Colors.textLight} />
            <Text style={styles.metaText}>{activity.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <DollarSign size={12} color={Colors.textLight} />
            <Text style={styles.metaText}>{activity.cost === 'free' ? 'Free' : activity.cost}</Text>
          </View>
          {activity.completedAt && (
            <View style={styles.metaItem}>
              <Calendar size={12} color={Colors.primary} />
              <Text style={[styles.metaText, { color: Colors.primary }]}>{formatDate(activity.completedAt)}</Text>
            </View>
          )}
          {hasNotes && (
            <View style={styles.metaItem}>
              <FileText size={12} color={Colors.accent} />
            </View>
          )}
        </View>

        {/* Rating for memories */}
        {isMemory && activity.rating && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <View
                key={star}
                style={[styles.ratingStar, star <= activity.rating! && styles.ratingStarFilled]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Arrow */}
      <ChevronRight size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: Typography.sizes.h1,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
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

  // Activity Card
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardPhotoContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  cardPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  photoCountText: {
    fontSize: Typography.sizes.tiny,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  cardContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardContentFull: {
    marginLeft: 0,
  },
  cardTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.textLight,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: Spacing.sm,
  },
  ratingStar: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundLight,
  },
  ratingStarFilled: {
    backgroundColor: Colors.accent,
  },
});
