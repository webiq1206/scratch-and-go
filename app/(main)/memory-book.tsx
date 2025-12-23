import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import Colors from '@/constants/colors';
import { BorderRadius } from '@/constants/design';
import { useMemoryBook } from '@/contexts/MemoryBookContext';
import { SavedActivity } from '@/types/activity';
import { Heart, Clock, DollarSign, Calendar, CheckCircle, FileText, Search, X, Filter, ArrowUpDown, CalendarPlus } from 'lucide-react-native';
import FilterPill from '@/components/ui/FilterPill';
import { addActivityToCalendar, calculateEndDate } from '@/utils/calendarUtils';

type Tab = 'saved' | 'completed';

const COST_FILTERS = ['All', 'Free', '$', '$$', '$$$'];
const CATEGORY_FILTERS = ['All', 'Chill', 'Active', 'Creative', 'Foodie', 'Adventure', 'Outdoor', 'Educational'];
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Recently Saved' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'alphabetical', label: 'A to Z' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

type SortOption = 'date-desc' | 'date-asc' | 'alphabetical' | 'rating-desc';

export default function MemoryBookScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCost, setSelectedCost] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { getSavedActivities, getCompletedActivities, markAsCompleted, markAsIncomplete, unsaveActivity, updateRating } = useMemoryBook();

  const savedActivities = getSavedActivities();
  const completedActivities = getCompletedActivities();

  const filteredActivities = useMemo(() => {
    const activities = activeTab === 'saved' ? savedActivities : completedActivities;
    
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
        return cost === filter || (filter === 'free' && cost === 'free');
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
          return b.savedAt - a.savedAt;
        case 'date-asc':
          return a.savedAt - b.savedAt;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'rating-desc':
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [activeTab, savedActivities, completedActivities, searchQuery, selectedCost, selectedCategory, sortBy]);

  const displayedActivities = filteredActivities;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleMarkComplete = (activityId: string) => {
    markAsCompleted(activityId);
  };

  const handleMarkIncomplete = (activityId: string) => {
    markAsIncomplete(activityId);
  };

  const handleDelete = (activityId: string) => {
    unsaveActivity(activityId);
  };

  const handleActivityPress = (activity: SavedActivity) => {
    router.push(`/activity/${activity.id}`);
  };

  const handleRatingChange = (activityId: string, rating: number) => {
    updateRating(activityId, rating);
  };

  const hasActiveFilters = searchQuery.trim() || selectedCost !== 'All' || selectedCategory !== 'All';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Adventures</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'saved' 
            ? 'Activities waiting for you'
            : 'Memories you\'ve created'
          }
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              style={styles.clearButton}
            >
              <X size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Filter size={18} color={Colors.primary} />
          <Text style={styles.filterToggleText}>Filters</Text>
          {(selectedCost !== 'All' || selectedCategory !== 'All') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Budget</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {COST_FILTERS.map((cost) => (
                <FilterPill
                  key={cost}
                  label={cost}
                  selected={selectedCost === cost}
                  onPress={() => setSelectedCost(cost)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {CATEGORY_FILTERS.map((category) => (
                <FilterPill
                  key={category}
                  label={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                />
              ))}
            </ScrollView>
          </View>

          {(selectedCost !== 'All' || selectedCategory !== 'All') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCost('All');
                setSelectedCategory('All');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFiltersText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.7}
        >
          <ArrowUpDown size={16} color={Colors.textLight} />
          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Sort'}
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
                {sortBy === option.value && (
                  <View style={styles.sortCheckmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
          activeOpacity={0.7}
        >
          <Heart 
            size={18} 
            color={activeTab === 'saved' ? Colors.primary : Colors.textLight}
            fill={activeTab === 'saved' ? Colors.primary : 'none'}
          />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved ({savedActivities.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.7}
        >
          <CheckCircle 
            size={18} 
            color={activeTab === 'completed' ? Colors.primary : Colors.textLight}
            fill={activeTab === 'completed' ? Colors.primary : 'none'}
          />
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed ({completedActivities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>
            {hasActiveFilters ? '🔍' : (activeTab === 'saved' ? '💝' : '🎉')}
          </Text>
          <Text style={styles.emptyTitle}>
            {hasActiveFilters
              ? 'No matching activities'
              : (activeTab === 'saved' ? 'No saved adventures' : 'No completed adventures')
            }
          </Text>
          <Text style={styles.emptyText}>
            {hasActiveFilters
              ? 'Try adjusting your search or filters'
              : (activeTab === 'saved'
                ? 'Start scratching cards and save activities\nyou want to try'
                : 'Mark activities as complete to see\nthem appear here'
              )
            }
          </Text>
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
          {displayedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => handleActivityPress(activity)}
              onMarkComplete={() => handleMarkComplete(activity.id)}
              onMarkIncomplete={() => handleMarkIncomplete(activity.id)}
              onDelete={() => handleDelete(activity.id)}
              onRatingChange={(rating) => handleRatingChange(activity.id, rating)}
              isCompleted={activeTab === 'completed'}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface ActivityCardProps {
  activity: SavedActivity;
  onPress: () => void;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  onDelete: () => void;
  onRatingChange: (rating: number) => void;
  isCompleted: boolean;
}

function ActivityCard({ activity, onPress, onMarkComplete, onMarkIncomplete, onDelete, onRatingChange, isCompleted }: ActivityCardProps) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  const handleAddToCalendar = async () => {
    if (isAddingToCalendar) return;
    
    setIsAddingToCalendar(true);
    try {
      const endDate = calculateEndDate(selectedDate, activity.duration);
      const success = await addActivityToCalendar({
        activity,
        startDate: selectedDate,
        endDate,
        notes: activity.notes,
      });
      
      if (success) {
        setShowCalendarModal(false);
        setSelectedDate(new Date());
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const onDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (_event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };
  return (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.activityHeader}>
        <Text style={styles.activityEmoji}>{activity.emoji}</Text>
        <View style={styles.activityHeaderText}>
          <Text style={styles.activityTitle} numberOfLines={2}>{activity.title}</Text>
          <Text style={styles.activityDescription} numberOfLines={2}>{activity.description}</Text>
        </View>
      </View>

      <View style={styles.activityMeta}>
        <View style={styles.metaItem}>
          <Clock size={14} color={Colors.textLight} />
          <Text style={styles.metaText}>{activity.duration}</Text>
        </View>
        <View style={styles.metaItem}>
          <DollarSign size={14} color={Colors.textLight} />
          <Text style={styles.metaText}>{activity.cost === 'free' ? 'Free' : activity.cost}</Text>
        </View>
        {activity.isCompleted && activity.completedAt && (
          <View style={styles.metaItem}>
            <Calendar size={14} color={Colors.primary} />
            <Text style={styles.metaText}>
              {new Date(activity.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        )}
        {activity.notes && (
          <View style={styles.metaItem}>
            <FileText size={14} color={Colors.accent} />
            <Text style={styles.metaText}>Note</Text>
          </View>
        )}
      </View>

      {isCompleted && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Rate your experience:</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={(e) => {
                  e.stopPropagation();
                  onRatingChange(star);
                }}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Image
                  source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/u0k4jkmq0pcfxvnip8sbu' }}
                  style={[
                    styles.starIcon,
                    { opacity: (activity.rating && star <= activity.rating) ? 1 : 0.3 }
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.activityActions}>
        <TouchableOpacity
          style={styles.calendarActionButton}
          onPress={(e) => {
            e.stopPropagation();
            setShowCalendarModal(true);
          }}
          activeOpacity={0.7}
        >
          <CalendarPlus size={16} color={Colors.accent} />
          <Text style={styles.calendarActionButtonText}>Schedule</Text>
        </TouchableOpacity>

        {!activity.isCompleted ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onMarkComplete();
            }}
            activeOpacity={0.7}
          >
            <CheckCircle size={16} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onMarkIncomplete();
            }}
            activeOpacity={0.7}
          >
            <CheckCircle size={16} color={Colors.textLight} />
            <Text style={styles.actionButtonText}>Incomplete</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {showCalendarModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Activity</Text>
            <Text style={styles.modalSubtitle}>Pick a date and time</Text>
            
            <View style={styles.dateTimeSection}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowDatePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Calendar size={16} color={Colors.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowTimePicker(true);
                }}
                activeOpacity={0.8}
              >
                <Clock size={16} color={Colors.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {selectedDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  textColor={Colors.text}
                  minimumDate={new Date()}
                />
              </View>
            )}

            {Platform.OS === 'ios' && showTimePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  onChange={onTimeChange}
                  textColor={Colors.text}
                />
              </View>
            )}

            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowCalendarModal(false);
                  setSelectedDate(new Date());
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmButton, isAddingToCalendar && { opacity: 0.5 }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCalendar();
                }}
                disabled={isAddingToCalendar}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>
                  {isAddingToCalendar ? 'Adding...' : 'Add to Calendar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  title: {
    fontSize: Typography.sizes.hero,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterToggleText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.primary,
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginLeft: Spacing.xs,
  },
  filtersPanel: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterSectionLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  filterScrollContent: {
    paddingRight: Spacing.lg,
  },
  clearFiltersButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.textLight,
    marginTop: Spacing.xs,
  },
  clearFiltersText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  sortContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignSelf: 'flex-start',
  },
  sortButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  sortMenu: {
    position: 'absolute',
    top: 40,
    left: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  sortMenuItemActive: {
    backgroundColor: Colors.primary + '10',
  },
  sortMenuItemText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  sortMenuItemTextActive: {
    color: Colors.primary,
  },
  sortCheckmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  activityCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  activityHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  activityEmoji: {
    fontSize: 48,
  },
  activityHeaderText: {
    flex: 1,
    gap: Spacing.xs,
  },
  activityTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  activityDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
  },
  activityActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.primary,
  },
  deleteButton: {
    flex: 0.6,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: '#FF4444',
  },
  ratingContainer: {
    paddingVertical: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  ratingLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  starIcon: {
    width: 24,
    height: 24,
  },
  calendarActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  calendarActionButtonText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.accent,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: '400' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  dateTimeSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dateTimeButtonText: {
    fontSize: Typography.sizes.caption,
    color: Colors.text,
    fontWeight: '400' as const,
  },
  pickerContainer: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalCancelText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.textLight,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: Typography.sizes.caption,
    fontWeight: '400' as const,
    color: Colors.text,
  },
});
