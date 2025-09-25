import 'package:flutter/widgets.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = [Locale('en')];

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static AppLocalizations of(BuildContext context) {
    final localizations = Localizations.of<AppLocalizations>(context, AppLocalizations);
    assert(localizations != null, 'No AppLocalizations found in context');
    return localizations!;
  }

  String get browse => 'Browse';
  String get loading => 'Loading…';
  String get retry => 'Retry';
  String get enroll => 'Enroll';
  String get viewSeasons => 'Browse catalog';
  String get viewCourse => 'View course';
  String get noSeasonsMessage => 'No seasons are currently available.';
  String get noCoursesMessage => 'No courses are available for this season yet.';
  String get noSectionsMessage => 'Sections will be announced soon.';
  String get errorMessage => 'Something went wrong. Please try again later.';
  String get seasonsTitle => 'Seasons';
  String get coursesTitle => 'Courses';
  String get sectionsTitle => 'Sections';
  String get courseDetailsTitle => 'Course details';
  String get instructorLabel => 'Instructor';
  String seatsLeft(int count) => '$count seats left';
  String sectionFallbackTitle(String id) => 'Section $id';
  String enrollmentPlaceholder(String courseId) => 'Enrollment flow for $courseId coming soon.';
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AppLocalizations.supportedLocales.contains(Locale(locale.languageCode));

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) => false;
}

extension AppLocalizationsX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
