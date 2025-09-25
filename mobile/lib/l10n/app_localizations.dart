import 'package:flutter/widgets.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = [Locale('en'), Locale('ar'), Locale('ja')];

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static AppLocalizations of(BuildContext context) {
    final localizations = Localizations.of<AppLocalizations>(context, AppLocalizations);
    assert(localizations != null, 'No AppLocalizations found in context');
    return localizations!;
  }

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'browse': 'Browse',
      'loading': 'Loading…',
      'retry': 'Retry',
      'enroll': 'Enroll',
      'viewSeasons': 'Browse catalog',
      'viewCourse': 'View course',
      'noSeasonsMessage': 'No seasons are currently available.',
      'noCoursesMessage': 'No courses are available for this season yet.',
      'noSectionsMessage': 'Sections will be announced soon.',
      'errorMessage': 'Something went wrong. Please try again later.',
      'seasonsTitle': 'Seasons',
      'coursesTitle': 'Courses',
      'sectionsTitle': 'Sections',
      'courseDetailsTitle': 'Course details',
      'instructorLabel': 'Instructor',
      'seatsLeft': '{count} seats left',
      'sectionFallbackTitle': 'Section {id}',
      'enrollmentPlaceholder': 'Enrollment flow for {courseId} coming soon.',
    },
    'ar': {
      'browse': 'تصفح',
      'loading': 'جارٍ التحميل…',
      'retry': 'إعادة المحاولة',
      'enroll': 'التسجيل',
      'viewSeasons': 'تصفح الكتالوج',
      'viewCourse': 'عرض الدورة',
      'noSeasonsMessage': 'لا توجد مواسم متاحة حالياً.',
      'noCoursesMessage': 'لا توجد دورات لهذا الموسم بعد.',
      'noSectionsMessage': 'سيتم الإعلان عن المجموعات قريباً.',
      'errorMessage': 'حدث خطأ ما. يرجى المحاولة لاحقاً.',
      'seasonsTitle': 'المواسم',
      'coursesTitle': 'الدورات',
      'sectionsTitle': 'المجموعات',
      'courseDetailsTitle': 'تفاصيل الدورة',
      'instructorLabel': 'المدرب',
      'seatsLeft': 'المقاعد المتبقية: {count}',
      'sectionFallbackTitle': 'المجموعة {id}',
      'enrollmentPlaceholder': 'عملية التسجيل للدورة {courseId} قيد الإعداد.',
    },
    'ja': {
      'browse': '閲覧',
      'loading': '読み込み中…',
      'retry': '再試行',
      'enroll': '申し込む',
      'viewSeasons': 'カタログを見る',
      'viewCourse': '講座を見る',
      'noSeasonsMessage': '現在利用可能なシーズンはありません。',
      'noCoursesMessage': 'このシーズンの講座はまだありません。',
      'noSectionsMessage': 'クラス情報は近日公開予定です。',
      'errorMessage': '問題が発生しました。しばらくしてからもう一度お試しください。',
      'seasonsTitle': 'シーズン',
      'coursesTitle': '講座',
      'sectionsTitle': 'クラス',
      'courseDetailsTitle': '講座の詳細',
      'instructorLabel': '講師',
      'seatsLeft': '残り{count}席',
      'sectionFallbackTitle': 'クラス{id}',
      'enrollmentPlaceholder': '{courseId} の申込フローは準備中です。',
    },
  };

  String _translate(String key) {
    final languageCode = locale.languageCode;
    final values = _localizedValues[languageCode] ?? _localizedValues['en']!;
    return values[key] ?? _localizedValues['en']![key] ?? key;
  }

  String _format(String key, Map<String, String> params) {
    var value = _translate(key);
    params.forEach((placeholder, replacement) {
      value = value.replaceAll('{$placeholder}', replacement);
    });
    return value;
  }

  String get browse => _translate('browse');
  String get loading => _translate('loading');
  String get retry => _translate('retry');
  String get enroll => _translate('enroll');
  String get viewSeasons => _translate('viewSeasons');
  String get viewCourse => _translate('viewCourse');
  String get noSeasonsMessage => _translate('noSeasonsMessage');
  String get noCoursesMessage => _translate('noCoursesMessage');
  String get noSectionsMessage => _translate('noSectionsMessage');
  String get errorMessage => _translate('errorMessage');
  String get seasonsTitle => _translate('seasonsTitle');
  String get coursesTitle => _translate('coursesTitle');
  String get sectionsTitle => _translate('sectionsTitle');
  String get courseDetailsTitle => _translate('courseDetailsTitle');
  String get instructorLabel => _translate('instructorLabel');
  String seatsLeft(int count) => _format('seatsLeft', {'count': '$count'});
  String sectionFallbackTitle(String id) => _format('sectionFallbackTitle', {'id': id});
  String enrollmentPlaceholder(String courseId) =>
      _format('enrollmentPlaceholder', {'courseId': courseId});
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
