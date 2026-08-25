const evaluationRepository = require('../db/repositories/evaluationRepository');
const { sendSuccess } = require('../utils/apiResponse');

const getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch data concurrently
    const [sessionsCompleted, recentEvaluations, weeklyTrend] = await Promise.all([
      evaluationRepository.getCountByUserId(userId),
      evaluationRepository.getRecentByUserId(userId, 10), // Fetch last 10 for detailed trends
      evaluationRepository.getWeeklyTrend(userId, 14)
    ]);

    // Average overall score over last 5 evaluations
    const last5 = recentEvaluations.slice(0, 5);
    let overallScore = null;
    let bestMetric = null;
    let weakestMetric = null;

    if (last5.length > 0) {
      const sum = last5.reduce((acc, curr) => acc + parseFloat(curr.overall_score), 0);
      overallScore = Math.round((sum / last5.length) * 10) / 10;

      // Analyze metrics to find strengths and weaknesses
      const metrics = [
        { name: 'Clarity', key: 'clarity_score' },
        { name: 'Fluency', key: 'fluency_score' },
        { name: 'Confidence', key: 'confidence_score' },
        { name: 'Structure', key: 'structure_score' },
        { name: 'Vocabulary', key: 'vocabulary_score' },
        { name: 'Relevance', key: 'relevance_score' }
      ];

      const averages = metrics.map(m => {
        const mSum = last5.reduce((acc, curr) => acc + parseFloat(curr[m.key] || 0), 0);
        return { name: m.name, avg: mSum / last5.length };
      });

      // Sort averages
      averages.sort((a, b) => b.avg - a.avg);
      bestMetric = averages[0].name;
      weakestMetric = averages[averages.length - 1].name;
    }

    return sendSuccess(res, {
      sessions_completed: sessionsCompleted,
      recent_evaluations: last5, // Return last 5 as requested
      weekly_trend: weeklyTrend,
      overall_score: overallScore,
      best_metric: bestMetric,
      weakest_metric: weakestMetric
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProgress };
