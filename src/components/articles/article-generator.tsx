'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  FileText,
  TrendingUp,
  Clock,
  Eye,
  Newspaper,
  Bot,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface GeneratedArticle {
  id?: string
  title: string
  content: string
  summary: string
  keyPoints: string[]
  marketAnalysis: string
  investmentImplications: string
  metadata: {
    wordCount: number
    readingTime: number
    sentiment: string
    categories: string[]
    generatedAt: string
  }
}

interface ArticleGeneratorProps {
  onArticleGenerated?: (article: GeneratedArticle) => void
}

export function ArticleGenerator({ onArticleGenerated }: ArticleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Custom news form state
  const [customNews, setCustomNews] = useState({
    title: '',
    content: '',
    source: '',
    category: 'general'
  })

  const handleGenerateFromLatestNews = async () => {
    setIsGenerating(true)
    setProgress(0)
    setCurrentStep('Fetching latest news...')

    try {
      // Simulate progress steps
      const steps = [
        'Fetching latest news...',
        'Analyzing news content...',
        'Gathering related information...',
        'Generating comprehensive article...',
        'Finalizing and saving...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        setProgress((i + 1) * 20)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const response = await fetch('/api/news/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error('Failed to generate article')
      }

      const result = await response.json()
      const article = result.generatedArticle

      setGeneratedArticle(article)
      onArticleGenerated?.(article)
      setProgress(100)
      setCurrentStep('Article generated successfully!')

    } catch (error) {
      console.error('Failed to generate article:', error)
      setCurrentStep('Failed to generate article')
      setProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateFromCustomNews = async () => {
    if (!customNews.title || !customNews.content) {
      alert('Please provide both title and content for the news')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setCurrentStep('Processing custom news...')

    try {
      const steps = [
        'Processing custom news...',
        'Analyzing content...',
        'Extracting key information...',
        'Generating article...',
        'Saving results...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        setProgress((i + 1) * 20)
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      const response = await fetch('/api/news/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customNews })
      })

      if (!response.ok) {
        throw new Error('Failed to generate article from custom news')
      }

      const result = await response.json()
      const article = result.generatedArticle

      setGeneratedArticle(article)
      onArticleGenerated?.(article)
      setProgress(100)
      setCurrentStep('Article generated successfully!')
      setShowCustomForm(false)

      // Reset form
      setCustomNews({
        title: '',
        content: '',
        source: '',
        category: 'general'
      })

    } catch (error) {
      console.error('Failed to generate article:', error)
      setCurrentStep('Failed to generate article')
      setProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Article Generator</span>
          </CardTitle>
          <CardDescription>
            Generate comprehensive financial articles from latest news or custom content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="latest-news" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="latest-news" className="flex items-center space-x-2">
                <Newspaper className="h-4 w-4" />
                <span>Latest News</span>
              </TabsTrigger>
              <TabsTrigger value="custom-news" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Custom News</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="latest-news" className="space-y-4">
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Generate from Latest News</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Our AI will automatically fetch the most important financial news
                  and generate a comprehensive analysis article
                </p>
                <Button
                  onClick={handleGenerateFromLatestNews}
                  disabled={isGenerating}
                  size="lg"
                  className="min-w-32"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Article
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom-news" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-title">News Title</Label>
                  <Input
                    id="custom-title"
                    placeholder="Enter the news headline..."
                    value={customNews.title}
                    onChange={(e) => setCustomNews(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-content">News Content</Label>
                  <Textarea
                    id="custom-content"
                    placeholder="Enter the full news content..."
                    rows={6}
                    value={customNews.content}
                    onChange={(e) => setCustomNews(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-source">Source (Optional)</Label>
                    <Input
                      id="custom-source"
                      placeholder="e.g., Reuters, Bloomberg..."
                      value={customNews.source}
                      onChange={(e) => setCustomNews(prev => ({ ...prev, source: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-category">Category</Label>
                    <Select
                      value={customNews.category}
                      onValueChange={(value) => setCustomNews(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="energy">Energy</SelectItem>
                        <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                        <SelectItem value="monetary-policy">Monetary Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateFromCustomNews}
                  disabled={isGenerating || !customNews.title || !customNews.content}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Generate from Custom News
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Dialog */}
      <Dialog open={isGenerating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <span>Generating Article</span>
            </DialogTitle>
            <DialogDescription>
              Please wait while our AI processes the news and generates your article
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated Article Preview */}
      {generatedArticle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Article Generated Successfully</span>
              </span>
              <Badge className={getSentimentColor(generatedArticle.metadata.sentiment)}>
                {generatedArticle.metadata.sentiment}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your AI-generated financial analysis is ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">{generatedArticle.title}</h3>
                <p className="text-muted-foreground">{generatedArticle.summary}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                <div className="text-center">
                  <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{generatedArticle.metadata.wordCount}</p>
                  <p className="text-xs text-muted-foreground">Words</p>
                </div>
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{generatedArticle.metadata.readingTime} min</p>
                  <p className="text-xs text-muted-foreground">Read time</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium capitalize">{generatedArticle.metadata.sentiment}</p>
                  <p className="text-xs text-muted-foreground">Sentiment</p>
                </div>
                <div className="text-center">
                  <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">New</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>

              {generatedArticle.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Points:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {generatedArticle.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Generated at {new Date(generatedArticle.metadata.generatedAt).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}