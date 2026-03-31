import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StyleSheet, Platform } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from '../services/auth';
import { getAllExpenses, Expense } from '../services/expense';
import { auth } from '../../firebaseConfig';
import { checkAndProcessRecurringExpenses } from '../services/recurring';
import { registerForPushNotificationsAsync } from '../services/notifications';
import * as ImagePicker from 'expo-image-picker';
import ScreenWrapper from '../components/ScreenWrapper';
import Card from '../components/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, commonStyles } from '../services/theme';

const screenWidth = Dimensions.get('window').width;

const HomeScreen = ({ navigation }: any) => {
    const [totalBalance, setTotalBalance] = useState(0);
    const [recentActivity, setRecentActivity] = useState<Expense[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [percentageChange, setPercentageChange] = useState(0);
    const [categoryData, setCategoryData] = useState<any[]>([]);

    const data = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
            {
                data: [20, 45, 28, 80, 99, 43], // TODO: Make dynamic
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                strokeWidth: 3
            }
        ]
    };

    const chartConfig = {
        backgroundGradientFrom: theme.colors.primary.main,
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: theme.colors.primary.main,
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#E0D8FD"
        },
        propsForLabels: {
            fontSize: 10,
            fontWeight: '600',
            fill: '#E0D8FD'
        }
    };

    const fetchDashboardData = async () => {
        try {
            const expenses = await getAllExpenses();
            const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            setTotalBalance(total);
            setRecentActivity(expenses.slice(0, 3));

            // Calculate Percentage Change (Current Month vs Last Month)
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const lastMonthDate = new Date();
            lastMonthDate.setMonth(now.getMonth() - 1);
            const lastMonth = lastMonthDate.getMonth();
            const lastMonthYear = lastMonthDate.getFullYear();

            let currentMonthTotal = 0;
            let lastMonthTotal = 0;
            const categoryTotals: { [key: string]: number } = {};

            expenses.forEach(expense => {
                const expenseDate = new Date(expense.createdAt);
                if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
                    currentMonthTotal += expense.amount;
                } else if (expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear) {
                    lastMonthTotal += expense.amount;
                }

                // Category Totals
                const cat = expense.category || 'General';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
            });

            if (lastMonthTotal === 0) {
                setPercentageChange(currentMonthTotal > 0 ? 100 : 0);
            } else {
                const change = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
                setPercentageChange(change);
            }

            // Prepare Pie Chart Data
            const colors = ['#7F5AF0', '#2CB67D', '#F472B6', '#3DA9FC', '#FF8906'];
            const chartData = Object.keys(categoryTotals).map((cat, index) => ({
                name: cat,
                amount: categoryTotals[cat],
                color: colors[index % colors.length],
                legendFontColor: theme.colors.text.secondary,
                legendFontSize: 12
            }));
            setCategoryData(chartData);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
            checkAndProcessRecurringExpenses();
            registerForPushNotificationsAsync();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, []);

    const handleScanBill = () => {
        navigation.navigate('GroupsTab', {
            screen: 'OCR',
            params: { fromHome: true }
        });
    };

    const handleUploadBill = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission needed');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            navigation.navigate('GroupsTab', {
                screen: 'OCR',
                params: { fromHome: true, initialImage: result.assets[0].uri }
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (days === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <ScreenWrapper>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary.main} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.welcomeText}>
                                WELCOME BACK,
                            </Text>
                            <Text style={styles.userNameText}>
                                {auth.currentUser?.displayName?.split(' ')[0] || 'User'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => signOut()}
                            style={styles.logoutButton}
                        >
                            <Ionicons name="log-out-outline" size={24} color={theme.colors.primary.main} />
                        </TouchableOpacity>
                    </View>

                    {/* Welcome Card */}
                    <LinearGradient
                        colors={['rgba(127, 90, 240, 0.15)', 'rgba(44, 182, 125, 0.1)']}
                        style={styles.welcomeCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.welcomeCardText}>
                            Track your expenses seamlessly with AI-powered insights
                        </Text>
                        <View style={styles.balanceContainer}>
                            <View style={styles.balanceInfo}>
                                <Text style={styles.balanceLabel}>
                                    Total Balance
                                </Text>
                                <Text style={styles.balanceAmount}>
                                    ₹{totalBalance.toFixed(2)}
                                </Text>
                            </View>
                            <View style={[
                                styles.percentageBadge,
                                percentageChange >= 0 ? styles.percentageBadgePositive : styles.percentageBadgeNegative
                            ]}>
                                <Text style={[
                                    styles.percentageText,
                                    percentageChange >= 0 ? styles.percentageTextPositive : styles.percentageTextNegative
                                ]}>
                                    {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Balance Card */}
                <Card gradient style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={styles.chartTitle}>Total Spending</Text>
                            <Text style={styles.chartAmount}>₹{totalBalance.toFixed(2)}</Text>
                        </View>
                        <View style={[
                            styles.percentageBadgeSmall,
                            percentageChange >= 0 ? styles.percentageBadgePositive : styles.percentageBadgeNegative
                        ]}>
                            <Text style={[
                                styles.percentageTextSmall,
                                percentageChange >= 0 ? styles.percentageTextPositive : styles.percentageTextNegative
                            ]}>
                                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                            </Text>
                        </View>
                    </View>

                    <LineChart
                        data={data}
                        width={screenWidth - 64} // Adjusted for padding
                        height={120}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        withInnerLines={false}
                        withOuterLines={false}
                        withVerticalLabels={true}
                        withHorizontalLabels={false}
                        withDots={false}
                        // @ts-ignore - Suppress transform-origin warning from chart kit on web
                        propsForDots={{
                            r: "4",
                            strokeWidth: "2",
                            stroke: "#E0D8FD"
                        }}
                    />
                </Card>

                {/* Category Breakdown */}
                <Text style={styles.sectionTitle}>
                    Spending by Category
                </Text>
                <Card style={styles.pieChartCard}>
                    {categoryData.length > 0 ? (
                        <PieChart
                            data={categoryData}
                            width={screenWidth - 64}
                            height={200}
                            chartConfig={chartConfig}
                            accessor={"amount"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No data available</Text>
                        </View>
                    )}
                </Card>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>
                    Quick Actions
                </Text>
                <View style={styles.quickActionsContainer}>
                    {[
                        { title: 'Scan Bill', icon: 'scan', color: '#7F5AF0', bg: '#E0D8FD', action: handleScanBill },
                        { title: 'Upload', icon: 'cloud-upload', color: '#2CB67D', bg: '#D5F2E5', action: handleUploadBill },
                        { title: 'Recurring', icon: 'calendar', color: '#FF8906', bg: '#FFE8CC', action: () => navigation.navigate('RecurringExpenses') },
                        { title: 'New Group', icon: 'people', color: '#F472B6', bg: '#FCE3EF', action: () => navigation.navigate('GroupsTab', { screen: 'GroupsList' }) }
                    ].map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={item.action}
                            style={styles.quickActionButton}
                        >
                            <View
                                style={[styles.quickActionIcon, { backgroundColor: item.bg }]}
                            >
                                <Ionicons name={item.icon as any} size={24} color={item.color} />
                            </View>
                            <Text style={styles.quickActionText}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Activity */}
                <View style={styles.recentActivityHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {recentActivity.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="receipt-outline" size={56} color={theme.colors.text.disabled} />
                        <Text style={styles.emptyStateText}>No recent activity</Text>
                    </View>
                ) : (
                    recentActivity.map((item) => (
                        <Card key={item.id} style={styles.activityCard}>
                            <View style={styles.activityContent}>
                                <View style={styles.activityIconContainer}>
                                    <Ionicons name="receipt" size={22} color={theme.colors.primary.main} />
                                </View>
                                <View style={styles.activityDetails}>
                                    <Text numberOfLines={1} style={styles.activityDescription}>
                                        {item.description}
                                    </Text>
                                    <Text style={styles.activityDate}>
                                        {formatDate(item.createdAt)}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.activityAmount}>
                                {item.currency || '₹'}{item.amount.toFixed(2)}
                            </Text>
                        </Card>
                    ))
                )}
                <View style={{ height: 32 }} />
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.xs,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xl,
    },
    headerContainer: {
        marginBottom: theme.spacing.lg,
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    welcomeText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.secondary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    userNameText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    logoutButton: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface.containerHigh,
        borderWidth: 1,
        borderColor: theme.colors.surface.container,
        ...theme.shadows.glow,
    },
    welcomeCard: {
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    welcomeCardText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginBottom: theme.spacing.md,
        fontWeight: '500',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceInfo: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    balanceAmount: {
        fontSize: 30,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.xs,
    },
    percentageBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
    },
    percentageBadgePositive: {
        backgroundColor: 'rgba(44, 182, 125, 0.2)',
        borderColor: 'rgba(44, 182, 125, 0.3)',
    },
    percentageBadgeNegative: {
        backgroundColor: 'rgba(239, 69, 101, 0.2)',
        borderColor: 'rgba(239, 69, 101, 0.3)',
    },
    percentageText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    percentageTextPositive: {
        color: '#4CD6A1',
    },
    percentageTextNegative: {
        color: '#FF7B93',
    },
    chartCard: {
        marginBottom: theme.spacing.lg,
        ...theme.shadows.glow,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.lg,
    },
    chartTitle: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    chartAmount: {
        color: theme.colors.text.primary,
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 4,
        letterSpacing: -0.5,
    },
    percentageBadgeSmall: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    percentageTextSmall: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    chart: {
        borderRadius: 16,
        paddingRight: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
        color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    pieChartCard: {
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.md,
        ...theme.shadows.sm,
        backgroundColor: theme.colors.surface.main,
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },
    noDataText: {
        color: theme.colors.text.secondary,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    quickActionButton: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
        ...theme.shadows.sm,
        backgroundColor: theme.colors.surface.main,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        color: theme.colors.text.primary,
    },
    recentActivityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    seeAllText: {
        color: theme.colors.primary.main,
        fontWeight: '600',
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
        opacity: 0.5,
    },
    emptyStateText: {
        marginTop: theme.spacing.sm,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    activityCard: {
        marginBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        ...theme.shadows.sm,
    },
    activityContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    activityIconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.surface.containerHigh,
    },
    activityDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    activityDescription: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    activityDate: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
        fontWeight: '500',
    },
    activityAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
});

export default HomeScreen;
