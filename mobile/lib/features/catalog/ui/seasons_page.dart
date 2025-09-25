import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../l10n/app_localizations.dart';
import '../logic/catalog_providers.dart';
import '../models/catalog_models.dart';

class SeasonsPage extends ConsumerWidget {
  const SeasonsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final seasonsValue = ref.watch(seasonsProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.seasonsTitle),
      ),
      body: seasonsValue.when(
        data: (seasons) {
          if (seasons.isEmpty) {
            return _EmptyState(message: l10n.noSeasonsMessage);
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(seasonsProvider);
              await ref.read(seasonsProvider.future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final season = seasons[index];
                return _SeasonCard(season: season);
              },
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemCount: seasons.length,
            ),
          );
        },
        error: (error, _) => _ErrorState(
          message: l10n.errorMessage,
          onRetry: () {
            ref.invalidate(seasonsProvider);
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _SeasonCard extends StatelessWidget {
  const _SeasonCard({required this.season});

  final SeasonSummary season;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final subtitle = _buildSubtitle(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              season.title,
              style: theme.textTheme.titleLarge,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle, style: theme.textTheme.bodyMedium),
            ],
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: () {
                  Navigator.of(context).pushNamed('/seasons/${season.code}');
                },
                child: Text(l10n.browse),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String? _buildSubtitle(BuildContext context) {
    final start = season.startDate;
    final end = season.endDate;
    if (start == null && end == null) {
      return null;
    }
    final locale = Localizations.localeOf(context).toLanguageTag();
    final formatter = DateFormat.yMMMMd(locale);
    if (start != null && end != null) {
      return '${formatter.format(start)} • ${formatter.format(end)}';
    }
    if (start != null) {
      return formatter.format(start);
    }
    return formatter.format(end!);
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          message,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: onRetry,
              child: Text(l10n.retry),
            ),
          ],
        ),
      ),
    );
  }
}
