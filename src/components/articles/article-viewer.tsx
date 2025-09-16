'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Clock,
  TrendingUp,
  Calendar,
  Newspaper,
  Bot,
  ExternalLink,
  ArrowLeft,
  Share2,
  Bookmark,
  Eye
} from 'lucide-react'

interface Article {
  id: string
  title: string
  summary: string
  content: string
  keyPoints: string[]
  marketAnalysis: string
  investmentImplications: string
  sourceTitle: string
  sourcePublisher: string
  sourceCategory: string
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
  entities: string[]
  wordCount: number
  readingTime: number
  aiModel: string
  createdAt: string
}

interface ArticleViewerProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArticleViewer({ article, open, onOpenChange }: ArticleViewerProps) {
  if (!article) return null

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'financial': 'bg-blue-100 text-blue-800',
      'technology': 'bg-purple-100 text-purple-800',
      'energy': 'bg-orange-100 text-orange-800',
      'cryptocurrency': 'bg-yellow-100 text-yellow-800',
      'monetary-policy': 'bg-indigo-100 text-indigo-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getModelIcon = (model: string) => {
    return model.includes('gpt') ? Bot : FileText
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatContent = (content: string) => {
    // Convert markdown-style headers and formatting to HTML-like structure
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('# ')) {
          return `<h1>${paragraph.slice(2)}</h1>`
        }
        if (paragraph.startsWith('## ')) {
          return `<h2>${paragraph.slice(3)}</h2>`
        }
        if (paragraph.startsWith('### ')) {
          return `<h3>${paragraph.slice(4)}</h3>`
        }
        return `<p>${paragraph}</p>`
      })
      .join('')
  }

  const ModelIcon = getModelIcon(article.aiModel)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getSentimentColor(article.sentiment)}>
                {article.sentiment}
              </Badge>
              <Badge className={getCategoryColor(article.sourceCategory)}>
                {article.sourceCategory}
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <ModelIcon className="h-3 w-3" />
                <span>{article.aiModel}</span>
              </Badge>
            </div>

            <DialogTitle className="text-2xl font-bold leading-tight">
              {article.title}
            </DialogTitle>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(article.createdAt)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{article.wordCount} words</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{article.readingTime} min read</span>
              </span>
              <span className="flex items-center space-x-1">
                <Newspaper className="h-4 w-4" />
                <span>{article.sourcePublisher}</span>
              </span>
            </div>

            {article.summary && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Executive Summary</h4>
                <p className="text-muted-foreground">{article.summary}</p>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Points */}
          {article.keyPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Key Takeaways</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {article.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: formatContent(article.content)
                }}
              />
            </CardContent>
          </Card>

          {/* Market Analysis */}
          {article.marketAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Market Impact Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{article.marketAnalysis}</p>
              </CardContent>
            </Card>
          )}

          {/* Investment Implications */}
          {article.investmentImplications && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Investment Implications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{article.investmentImplications}</p>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Keywords */}
            {article.keywords.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Keywords</h4>
                <div className="flex flex-wrap gap-1">
                  {article.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Entities */}
            {article.entities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Key Entities</h4>
                <div className="flex flex-wrap gap-1">
                  {article.entities.map((entity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Source Information */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Source Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="font-medium min-w-20">Original:</span>
                  <span className="text-muted-foreground">{article.sourceTitle}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium min-w-20">Publisher:</span>
                  <span className="text-muted-foreground">{article.sourcePublisher}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium min-w-20">AI Model:</span>
                  <span className="text-muted-foreground flex items-center space-x-1">
                    <ModelIcon className="h-3 w-3" />
                    <span>{article.aiModel}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">Disclaimer:</p>
            <p>
              This analysis is AI-generated based on publicly available information and should not be considered as personalized investment advice.
              Please consult with qualified financial professionals before making investment decisions. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}