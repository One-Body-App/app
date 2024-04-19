import { StyleSheet } from 'react-native';
import { spacing } from '@/src/styles/spacing';

export const localstyle = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginHorizontal: spacing.x20,
  },
  iconContainer: {
    marginRight: 'auto',
    paddingRight: spacing.x16,
  },
  clearAllText: {
    fontSize: 24,
    color: '#126B87',
    marginEnd: spacing.x10,
  },
  content: {
    paddingHorizontal: spacing.x16,
    paddingTop: spacing.x20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x20,
  },
  label: {
    fontSize: 18,
    paddingHorizontal: spacing.x5,
    marginTop: spacing.x20,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F2F3F3',
    paddingHorizontal: spacing.x10,
    borderRadius: 5,
    marginTop: spacing.x10,
  },
  mapIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
    marginTop: spacing.x5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'gray',
  },
  sliderContainer: {
    marginBottom: spacing.x20,
    backgroundColor: '#F2F3F3',
    paddingVertical: spacing.x10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: spacing.x10,
  },
  slider: {
    width: '100%',
  },
  rangeText: {
    fontSize: spacing.x16,
    marginLeft: spacing.x10,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgTypeContainer: {
    marginBottom: spacing.x20,
    paddingHorizontal: spacing.x16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.x17,
  },
  button: {
    backgroundColor: '#F3F2F2',
    paddingHorizontal: spacing.x20,
    paddingVertical: spacing.x10,
    borderRadius: spacing.x20,
  },
  buttonText: {
    fontSize: 16,
    color: 'black',
  },
  arrowIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
    marginTop: spacing.x5,
  },
  applyFilterButton: {
    backgroundColor: '#126B87',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: spacing.x104,
  },
  applyFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateOptionsContainer: {
    flexDirection: 'row',
    marginTop: spacing.x10,
  },
  dateOptionButton: {
    marginRight: spacing.x10,
  },
});
