import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function ConfigureTicketsFreeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  // State to manage ticket tiers
  const [tickets, setTickets] = useState([{ id: '1', name: 'General Admission', quantity: '100' }]);

  const addTicketType = () => {
    const newId = (tickets.length + 1).toString();
    setTickets([...tickets, { id: newId, name: '', quantity: '' }]);
  };

  const updateTicket = (id: string, field: string, value: string) => {
    setTickets(
      tickets.map((ticket) => (ticket.id === id ? { ...ticket, [field]: value } : ticket))
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Go! Event Hub</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>?</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>STEP 5 OF 7</Text>
            <Text style={styles.percentageText}>70%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          {/* Section: Title & Description */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Configure Tickets</Text>
            <Text style={styles.sectionSubtitle}>
              Set up the ticket details for your free event. Your attendees will not be charged.
            </Text>
          </View>

          {/* Ticket Forms Array */}
          {tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              {/* Ticket Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ticket Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={ticket.name}
                  onChangeText={(val) => updateTicket(ticket.id, 'name', val)}
                  placeholder="e.g. General Admission"
                  placeholderTextColor={isDarkMode ? '#68828a' : '#9aacb1'}
                />
              </View>

              {/* Quantity & Price Row */}
              <View style={styles.row}>
                <View style={styles.inputContainerHalf}>
                  <Text style={styles.label}>Total Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ticket.quantity}
                    onChangeText={(val) => updateTicket(ticket.id, 'quantity', val)}
                    placeholder="e.g. 100"
                    placeholderTextColor={isDarkMode ? '#68828a' : '#9aacb1'}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.helperText}>Leave empty for unlimited</Text>
                </View>

                <View style={styles.inputContainerHalf}>
                  <Text style={styles.label}>Price</Text>
                  <View style={[styles.priceInputContainer, styles.disabledInputContainer]}>
                    <Text style={styles.currencySymbolDisabled}>$</Text>
                    <TextInput style={styles.priceInputDisabled} value="0.00" editable={false} />
                  </View>
                  <View style={styles.freeEventModeBadge}>
                    <Text style={styles.infoIconSmall}>ℹ️</Text>
                    <Text style={styles.freeEventModeText}>Free Event Mode Active</Text>
                  </View>
                </View>
              </View>

              {/* Digital Tickets Info Banner */}
              <View style={styles.digitalTicketsBanner}>
                <Text style={styles.ticketIcon}>🎟️</Text>
                <View style={styles.digitalTicketsTextContainer}>
                  <Text style={styles.digitalTicketsTitle}>Digital Tickets</Text>
                  <Text style={styles.digitalTicketsSubtitle}>
                    QR-coded tickets will be sent to attendee emails automatically.
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Add Another Ticket Type Button */}
          <TouchableOpacity style={styles.addTicketButton} onPress={addTicketType}>
            <Text style={styles.addIcon}>⊕</Text>
            <Text style={styles.addTicketText}>Add another ticket type</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Fixed Bottom Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Continue</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Generate styles based on color scheme
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1e333a' : '#e6eaec',
    },
    iconButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.1)' : 'rgba(18, 107, 135, 0.05)',
    },
    iconText: {
      fontSize: 20,
      color: '#126b87',
      fontWeight: 'bold',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 120, // Space for absolute footer
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    stepText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: isDarkMode ? '#b3c1c5' : '#4f6d77',
    },
    percentageText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#126b87',
    },
    progressTrack: {
      height: 8,
      backgroundColor: isDarkMode ? '#1e333a' : '#e6eaec',
      borderRadius: 4,
      marginBottom: 24,
      overflow: 'hidden',
    },
    progressFill: {
      width: '70%',
      height: '100%',
      backgroundColor: '#126b87',
      borderRadius: 4,
    },
    sectionHeaderContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: isDarkMode ? '#9aacb1' : '#4f6d77',
      lineHeight: 22,
    },
    ticketCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.03,
      shadowRadius: 4,
      elevation: 2,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#e6eaec' : '#032f3c',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      borderRadius: 8,
      paddingHorizontal: 16,
      height: 48,
      fontSize: 15,
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    inputContainerHalf: {
      width: '48%',
    },
    helperText: {
      fontSize: 12,
      color: isDarkMode ? '#68828a' : '#68828a',
      marginTop: 6,
    },
    priceInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      height: 48,
    },
    disabledInputContainer: {
      backgroundColor: isDarkMode ? '#162a30' : '#f1f5f9',
      borderColor: isDarkMode ? '#355963' : '#e2e8f0',
    },
    currencySymbolDisabled: {
      fontSize: 15,
      fontWeight: '600',
      color: isDarkMode ? '#68828a' : '#94a3b8',
      marginRight: 8,
    },
    priceInputDisabled: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: isDarkMode ? '#68828a' : '#94a3b8',
    },
    freeEventModeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    infoIconSmall: {
      fontSize: 12,
      marginRight: 4,
    },
    freeEventModeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#126b87',
    },
    digitalTicketsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.15)' : 'rgba(18, 107, 135, 0.05)',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(18, 107, 135, 0.3)' : 'rgba(18, 107, 135, 0.1)',
      borderRadius: 8,
      padding: 16,
      marginTop: 16,
    },
    ticketIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    digitalTicketsTextContainer: {
      flex: 1,
    },
    digitalTicketsTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 2,
    },
    digitalTicketsSubtitle: {
      fontSize: 13,
      color: isDarkMode ? '#9aacb1' : '#4f6d77',
      lineHeight: 18,
    },
    addTicketButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.15)' : 'rgba(18, 107, 135, 0.1)',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(18, 107, 135, 0.3)',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    addIcon: {
      fontSize: 20,
      color: '#126b87',
    },
    addTicketText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: '#126b87',
      marginLeft: 12,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#111d21' : '#ffffff',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1e333a' : '#e6eaec',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 12,
      elevation: 10,
    },
    backButton: {
      flex: 1,
      flexDirection: 'row',
      height: 56,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#126b87',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      backgroundColor: 'transparent',
    },
    backButtonText: {
      color: '#126b87',
      fontSize: 16,
      fontWeight: '700',
    },
    nextButton: {
      flex: 2,
      flexDirection: 'row',
      backgroundColor: '#126b87',
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#126b87',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    nextButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
      marginRight: 8,
    },
    arrowIcon: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '700',
    },
  });
