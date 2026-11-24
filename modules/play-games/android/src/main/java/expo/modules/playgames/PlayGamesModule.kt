package expo.modules.playgames

import android.app.Activity
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.PlayGamesSdk
import com.google.android.gms.games.leaderboard.LeaderboardScore
import com.google.android.gms.games.leaderboard.LeaderboardVariant
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayGamesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PlayGames")

    AsyncFunction("signIn") { promise: Promise ->
      withActivity(promise, signedOut()) { activity, settled ->
        PlayGames.getGamesSignInClient(activity).signIn().addOnCompleteListener {
          if (!it.isSuccessful || it.result?.isAuthenticated != true) settled.resolve(signedOut())
          else loadPlayer(activity, settled)
        }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getStatus") { promise: Promise ->
      withActivity(promise, signedOut()) { activity, settled ->
        PlayGames.getGamesSignInClient(activity).isAuthenticated().addOnCompleteListener {
          if (!it.isSuccessful || it.result?.isAuthenticated != true) settled.resolve(signedOut())
          else loadPlayer(activity, settled)
        }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("submitScore") { leaderboardId: String, score: Double, promise: Promise ->
      if (score < 0 || score % 1.0 != 0.0) {
        promise.resolve(false)
        return@AsyncFunction
      }
      withActivity(promise, false) { activity, settled ->
        PlayGames.getGamesSignInClient(activity).isAuthenticated().addOnCompleteListener { auth ->
          if (!auth.isSuccessful || auth.result?.isAuthenticated != true) {
            settled.resolve(false)
            return@addOnCompleteListener
          }
          PlayGames.getLeaderboardsClient(activity)
            .submitScoreImmediate(leaderboardId, score.toLong())
            .addOnCompleteListener { settled.resolve(it.isSuccessful) }
        }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("loadScores") { leaderboardId: String, span: String, limit: Double, promise: Promise ->
      val empty = scorePage(emptyList(), null)
      withActivity(promise, empty) { activity, settled ->
        val timeSpan = timeSpan(span)
        val count = limit.toInt().coerceIn(1, 25)
        val leaderboards = PlayGames.getLeaderboardsClient(activity)
        PlayGames.getPlayersClient(activity).currentPlayer.addOnCompleteListener { playerTask ->
          val playerId = if (playerTask.isSuccessful) playerTask.result.playerId else null
          leaderboards
            .loadTopScores(leaderboardId, timeSpan, LeaderboardVariant.COLLECTION_PUBLIC, count, false)
            .addOnCompleteListener { top ->
              if (!top.isSuccessful) {
                settled.resolve(empty)
                return@addOnCompleteListener
              }
              val entries = readScores(top.result?.get(), playerId)
              leaderboards
                .loadCurrentPlayerLeaderboardScore(leaderboardId, timeSpan, LeaderboardVariant.COLLECTION_PUBLIC)
                .addOnCompleteListener { mine ->
                  val player = if (mine.isSuccessful) mine.result?.get()?.let { scoreMap(it, playerId) } else null
                  settled.resolve(scorePage(entries, player))
                }
            }
        }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("showLeaderboard") { leaderboardId: String, span: String, promise: Promise ->
      withActivity(promise, false) { activity, settled ->
        PlayGames.getLeaderboardsClient(activity)
          .getLeaderboardIntent(leaderboardId, timeSpan(span))
          .addOnCompleteListener {
            if (!it.isSuccessful) {
              settled.resolve(false)
              return@addOnCompleteListener
            }
            runCatching { activity.startActivity(it.result) }
            settled.resolve(true)
          }
      }
    }.runOnQueue(Queues.MAIN)
  }

  private fun withActivity(promise: Promise, fallback: Any?, body: (Activity, Settled) -> Unit) {
    val settled = Settled(promise)
    val activity = appContext.currentActivity
    if (activity == null) {
      settled.resolve(fallback)
      return
    }
    try {
      PlayGamesSdk.initialize(activity)
      body(activity, settled)
    } catch (_: Exception) {
      settled.resolve(fallback)
    }
  }

  private fun loadPlayer(activity: Activity, settled: Settled) {
    PlayGames.getPlayersClient(activity).currentPlayer.addOnCompleteListener {
      if (!it.isSuccessful) {
        settled.resolve(signedOut())
        return@addOnCompleteListener
      }
      val player = it.result
      settled.resolve(
        mapOf(
          "authenticated" to true,
          "displayName" to player.displayName,
          "iconUri" to player.iconImageUri?.toString(),
          "playerId" to player.playerId,
        ),
      )
    }
  }

  private fun readScores(scores: com.google.android.gms.games.LeaderboardsClient.LeaderboardScores?, playerId: String?): List<Map<String, Any?>> {
    val buffer = scores?.scores ?: return emptyList()
    return try {
      List(buffer.count) { index -> scoreMap(buffer.get(index), playerId) }
    } finally {
      buffer.release()
    }
  }

  private fun scoreMap(score: LeaderboardScore, playerId: String?): Map<String, Any?> {
    val id = score.scoreHolder?.playerId ?: ""
    return mapOf(
      "rank" to score.rank.toDouble(),
      "score" to score.rawScore.toDouble(),
      "displayName" to (score.scoreHolderDisplayName ?: ""),
      "iconUri" to score.scoreHolderIconImageUri?.toString(),
      "playerId" to id,
      "currentPlayer" to (playerId != null && id == playerId),
    )
  }

  private fun scorePage(entries: List<Map<String, Any?>>, player: Map<String, Any?>?): Map<String, Any?> =
    mapOf("entries" to entries, "player" to player)

  private fun signedOut(): Map<String, Any?> =
    mapOf("authenticated" to false, "displayName" to null, "iconUri" to null, "playerId" to null)

  private fun timeSpan(span: String): Int = when (span) {
    "daily" -> LeaderboardVariant.TIME_SPAN_DAILY
    "weekly" -> LeaderboardVariant.TIME_SPAN_WEEKLY
    else -> LeaderboardVariant.TIME_SPAN_ALL_TIME
  }
}

private class Settled(private val promise: Promise) {
  private var done = false

  fun resolve(value: Any?) {
    if (done) return
    done = true
    promise.resolve(value)
  }
}
